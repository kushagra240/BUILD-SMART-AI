import functools
import logging
import uuid
from pathlib import Path
from typing import Any, Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.calculator import calculate_estimate
from app.engine.contracts import EstimationInput, EstimationResult
from app.models.estimate import Estimate
from app.schemas.estimate import (
    BreakdownCategoryItem,
    BudgetAssessment,
    ConfidenceEstimate,
    CostDriverItem,
    EstimateCreate,
    EstimateResponse,
    MaterialRecommendationItem,
    ModelMetaItem,
    TotalEstimate,
)
from app.services import project_service

logger = logging.getLogger(__name__)

FEATURE_COLUMNS: list[str] = [
    "built_up_area",
    "floors",
    "quality_tier_encoded",
    "zone_id_encoded",
]

TIER_ENCODING: dict[str, int] = {
    "economy": 0,
    "standard": 1,
    "premium": 2,
}

ZONE_ENCODING: dict[str, int] = {
    "ZN-PMC": 0,
    "ZN-PCMC": 1,
    "ZN-CANT": 2,
    "ZN-COUNCIL": 3,
    "ZN-OTHER": 4,
}

_MODEL_CANDIDATE_PATHS: list[Path] = [
    Path(__file__).resolve().parent.parent.parent / "ml" / "ml_model.pkl",
    Path(__file__).resolve().parent.parent.parent.parent.parent / "ml" / "ml_model.pkl",
    Path("apps/api/ml/ml_model.pkl").resolve(),
    Path("ml/ml_model.pkl").resolve(),
]


@functools.lru_cache(maxsize=1)
def load_ml_model() -> Any | None:
    """Load and cache the trained RandomForestRegressor calibration model in memory."""
    for path in _MODEL_CANDIDATE_PATHS:
        if path.is_file():
            try:
                model = joblib.load(path)
                logger.info("Loaded ML calibration model from %s", path)
                return model
            except Exception as exc:
                logger.warning("Failed loading ML model from %s: %s", path, exc)
    logger.warning("No ML calibration model found; falling back to default variance.")
    return None


def predict_variance(
    built_up_area: float,
    floors: int,
    quality_tier: str,
    zone_id: str,
) -> float:
    """Predict cost variance percentage for contingency calibration.

    Features: [built_up_area, floors, quality_tier_encoded, zone_id_encoded]
    Target: variance percentage (clamped to [0.05, 0.30])
    """
    model = load_ml_model()
    tier_enc = TIER_ENCODING.get(quality_tier, 1)
    zone_enc = ZONE_ENCODING.get(zone_id, 0)

    if model is not None:
        try:
            features_df = pd.DataFrame(
                [[built_up_area, floors, tier_enc, zone_enc]],
                columns=FEATURE_COLUMNS,
            )
            pred = float(model.predict(features_df)[0])
            return float(np.clip(pred, 0.05, 0.30))
        except Exception as exc:
            logger.warning("ML variance prediction error: %s; using default 0.10", exc)

    return 0.10


def apply_ml_calibration(
    result: EstimationResult,
    inputs: EstimationInput | EstimateCreate,
) -> EstimationResult:
    """Apply the secondary ML calibration layer to adjust P10/P90 range and budget assessment.

    Uses the scikit-learn RandomForestRegressor to predict dynamic variance percentage
    from [built_up_area, floors, quality_tier_encoded, zone_id_encoded], adjusting
    the confidence spread and evaluating the budget against the calibrated bounds.
    """
    area = float(inputs.built_up_area_sqft)
    floors = int(inputs.floors)
    tier = str(inputs.quality_tier)
    zone = str(inputs.zone_id)

    variance_pct = predict_variance(area, floors, tier, zone)

    p50 = result.total.p50
    calibrated_p10 = int(round(p50 * (1.0 - variance_pct)))
    calibrated_p90 = int(round(p50 * (1.0 + variance_pct * 1.5)))

    budget_inr = getattr(inputs, "budget_inr", None)
    new_budget_status = result.budget.status
    new_budget_gap = result.budget.gap_inr

    if budget_inr is not None and budget_inr > 0:
        if budget_inr >= p50:
            new_budget_status = "within"
            new_budget_gap = int(budget_inr - p50)
        elif budget_inr >= calibrated_p10:
            new_budget_status = "tight"
            new_budget_gap = int(p50 - budget_inr)
        else:
            new_budget_status = "below_minimum"
            new_budget_gap = int(calibrated_p10 - budget_inr)

    new_confidence_reason = result.confidence.reason
    if "ML calibration" not in new_confidence_reason:
        new_confidence_reason += (
            f" Secondary ML calibration applied (RandomForestRegressor v1.0.0; "
            f"predicted variance: {variance_pct:.1%})."
        )

    calibrated_total = result.total.model_copy(
        update={"p10": calibrated_p10, "p90": calibrated_p90}
    )
    calibrated_budget = result.budget.model_copy(
        update={"status": new_budget_status, "gap_inr": new_budget_gap}
    )
    calibrated_confidence = result.confidence.model_copy(
        update={"reason": new_confidence_reason}
    )

    return result.model_copy(
        update={
            "total": calibrated_total,
            "budget": calibrated_budget,
            "confidence": calibrated_confidence,
        }
    )


async def create_estimate_for_project(
    db: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    inputs: EstimateCreate,
    is_mock: bool = False,
) -> EstimateResponse:
    """Run bottom-up estimation logic and record an immutable Estimate row in DB."""
    project = await project_service.get_project_by_id(db, user_id, project_id)

    engine_input = EstimationInput(
        built_up_area_sqft=inputs.built_up_area_sqft,
        floors=inputs.floors,
        bedrooms=inputs.bedrooms,
        bathrooms=inputs.bathrooms,
        zone_id=inputs.zone_id,
        quality_tier=inputs.quality_tier,
        construction_type=inputs.construction_type,
        plot_area_sqft=inputs.plot_area_sqft,
        budget_inr=inputs.budget_inr,
    )

    result = await calculate_estimate(db, engine_input)
    result = apply_ml_calibration(result, engine_input)

    estimate = Estimate(
        project_id=project.id,
        inputs=inputs.model_dump(),
        total_p50=result.total.p50,
        total_p10=result.total.p10,
        total_p90=result.total.p90,
        confidence_label=result.confidence.label,
        breakdown=[b.model_dump() for b in result.breakdown],
        materials=[],
        drivers=[d.model_dump() for d in result.drivers],
        budget_inr=inputs.budget_inr,
        budget_status=result.budget.status,
        is_mock=result.is_mock,
    )
    db.add(estimate)
    await db.commit()
    await db.refresh(estimate)

    return EstimateResponse(
        id=estimate.id,
        project_id=project.id,
        total=TotalEstimate(
            p50=result.total.p50,
            p10=result.total.p10,
            p90=result.total.p90,
            currency=result.total.currency,
        ),
        confidence=ConfidenceEstimate(
            label=result.confidence.label,
            reason=result.confidence.reason,
        ),
        breakdown=[
            BreakdownCategoryItem(
                category=b.category,
                amount=b.amount,
                share_pct=b.share_pct,
            )
            for b in result.breakdown
        ],
        materials=[],
        budget=BudgetAssessment(
            status=result.budget.status,
            gap_inr=result.budget.gap_inr,
        ),
        drivers=[
            CostDriverItem(
                label=d.label,
                impact_pct=d.impact_pct,
            )
            for d in result.drivers
        ],
        model=ModelMetaItem(
            version=result.engine_version,
            data_version=result.dataset_version,
        ),
        disclaimer=result.disclaimer,
        inputs=inputs,
        is_mock=result.is_mock,
        created_at=estimate.created_at,
    )


async def get_estimate_by_id(
    db: AsyncSession,
    user_id: uuid.UUID,
    estimate_id: uuid.UUID,
) -> EstimateResponse:
    """Fetch an estimate by ID checking user ownership of parent project."""
    stmt = (
        select(Estimate)
        .join(Estimate.project)
        .where(
            Estimate.id == estimate_id,
            Estimate.project.has(user_id=user_id, deleted_at=None),
        )
    )
    res = await db.execute(stmt)
    estimate = res.scalar_one_or_none()

    if not estimate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimate not found",
        )

    saved_confidence_label: Literal["High", "Medium", "Low"] = estimate.confidence_label  # type: ignore[assignment]
    saved_budget_status: Literal["within", "tight", "below_minimum", "not_provided"] = (
        estimate.budget_status or "not_provided"  # type: ignore[assignment]
    )

    return EstimateResponse(
        id=estimate.id,
        project_id=estimate.project_id,
        total=TotalEstimate(
            p50=estimate.total_p50,
            p10=estimate.total_p10,
            p90=estimate.total_p90,
            currency="INR",
        ),
        confidence=ConfidenceEstimate(
            label=saved_confidence_label,
            reason="Calculated bottom-up from Maharashtra PWD SSR 2022-23 rates.",
        ),
        breakdown=[BreakdownCategoryItem.model_validate(b) for b in estimate.breakdown],
        materials=[MaterialRecommendationItem.model_validate(m) for m in estimate.materials],
        budget=BudgetAssessment(
            status=saved_budget_status,
            gap_inr=0,
        ),
        drivers=[CostDriverItem.model_validate(d) for d in (estimate.drivers or [])],
        model=ModelMetaItem(version="1.0.0", data_version="v1.0.0"),
        disclaimer=(
            "Preliminary estimate calculated bottom-up using Maharashtra PWD SSR 2022-23 rates."
        ),
        inputs=EstimateCreate.model_validate(estimate.inputs),
        is_mock=getattr(estimate, "is_mock", False),
        created_at=estimate.created_at,
    )
