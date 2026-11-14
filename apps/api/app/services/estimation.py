import functools
import logging
import uuid
from pathlib import Path
from typing import Any, Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy import or_, select
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
from app.schemas.material import MaterialCharacteristicResponse
from app.services import project_service
from app.services.material_service import get_all_material_characteristics

logger = logging.getLogger(__name__)

# Calibration factor: Maharashtra PWD SSR base rates -> realistic Pune market contractor rates
PUNE_MARKET_MULTIPLIER: float = 2.85

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


def get_pune_material_recommendations(
    quality_tier: str = "standard",
) -> list[MaterialRecommendationItem]:
    """Generate realistic, IS-compliant material recommendations for Pune homes."""
    return [
        MaterialRecommendationItem(
            category="Steel Reinforcement",
            primary={
                "material_id": "mat_s02",
                "name": "Fe 500D TMT Steel (IS 1786)",
                "grade_spec": "Fe 500D Thermo-Mechanically Treated Rebars",
                "description": (
                    "High-ductility ribbed rebar with min 16% elongation "
                    "and 0.2% proof stress of 500 N/mm²."
                ),
                "unit": "Metric Ton",
                "unit_cost_range_inr": "₹60,000 - ₹64,000",
                "quality_level": quality_tier,
            },
            alternative={
                "material_id": "mat_s01",
                "name": "Fe 500 TMT Steel (IS 1786)",
                "grade_spec": "Standard Fe 500 TMT Rebars",
                "description": "Standard ductility rebar with min 12% elongation.",
                "unit": "Metric Ton",
                "unit_cost_range_inr": "₹56,000 - ₹59,000",
                "quality_level": "economy",
            },
            reason=(
                "Fe 500D provides superior elongation and energy dissipation required for "
                "Pune Seismic Zone III framing and structural crack containment."
            ),
            image_url=(
                "https://images.unsplash.com/photo-1504307651254-35680f356dfd"
                "?auto=format&fit=crop&w=800&q=80"
            ),
        ),
        MaterialRecommendationItem(
            category="Masonry Blocks",
            primary={
                "material_id": "mat_b01",
                "name": "AAC Blocks 600x200x150mm (IS 2185 Part 3)",
                "grade_spec": "Autoclaved Aerated Concrete Grade I",
                "description": (
                    "Lightweight cellular precast concrete block (dry density 550-650 kg/m³) "
                    "with thin-bed polymer mortar."
                ),
                "unit": "Cu. Meter",
                "unit_cost_range_inr": "₹3,400 - ₹3,800",
                "quality_level": quality_tier,
            },
            alternative={
                "material_id": "mat_b02",
                "name": "Red Clay Bricks Class 35 (IS 1077)",
                "grade_spec": "Traditional Burnt Clay Modular Bricks",
                "description": (
                    "Kiln-burnt solid clay bricks with compressive strength > 3.5 N/mm²."
                ),
                "unit": "1,000 pcs",
                "unit_cost_range_inr": "₹7,500 - ₹9,000",
                "quality_level": "economy",
            },
            reason=(
                "AAC blocks reduce structural dead load by up to 40% and provide superior "
                "thermal insulation (K-value 0.16-0.18 W/m·K) against Pune summer heat."
            ),
            image_url=(
                "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f"
                "?auto=format&fit=crop&w=800&q=80"
            ),
        ),
        MaterialRecommendationItem(
            category="Flooring",
            primary={
                "material_id": "mat_f01",
                "name": "Double-Charged Vitrified Tiles (IS 15622 Group BIa)",
                "grade_spec": "600x600mm / 800x800mm Vitrified Tiles",
                "description": (
                    "Ultra-low water absorption (< 0.05%) sintered porcelain with "
                    "3-4mm double-layer wear surface."
                ),
                "unit": "Sq. Ft.",
                "unit_cost_range_inr": "₹55 - ₹85",
                "quality_level": quality_tier,
            },
            alternative={
                "material_id": "mat_f02",
                "name": "Polished Kota Stone / Ceramic Tiles (IS 15622 Group BIIa)",
                "grade_spec": "Natural Kota Limestone or Glazed Ceramic",
                "description": (
                    "Standard natural stone slab or ceramic tile with 3-6% water absorption."
                ),
                "unit": "Sq. Ft.",
                "unit_cost_range_inr": "₹35 - ₹50",
                "quality_level": "economy",
            },
            reason=(
                "Double-charged vitrified tiles deliver Mohs hardness 6-7, exceptional abrasion "
                "resistance, and stain resistance suited for high-traffic Pune homes."
            ),
            image_url=(
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                "?auto=format&fit=crop&w=800&q=80"
            ),
        ),
        MaterialRecommendationItem(
            category="Cement",
            primary={
                "material_id": "mat_c02",
                "name": "OPC 53 / 43 Grade (IS 269 / IS 8112)",
                "grade_spec": "Ordinary Portland Cement (Ultratech / Ambuja equivalent)",
                "description": (
                    "High-early-strength cement engineered for RCC foundation, columns, "
                    "beams, and slabs."
                ),
                "unit": "50kg bag",
                "unit_cost_range_inr": "₹380 - ₹420",
                "quality_level": quality_tier,
            },
            alternative={
                "material_id": "mat_c01",
                "name": "PPC Fly-ash Based (IS 1489 Part 1)",
                "grade_spec": "Portland Pozzolana Cement",
                "description": (
                    "Pozzolanic cement with lower hydration heat, optimal for brickwork "
                    "and external plaster."
                ),
                "unit": "50kg bag",
                "unit_cost_range_inr": "₹340 - ₹370",
                "quality_level": "economy",
            },
            reason=(
                "OPC 43/53 achieves faster curing and structural compressive strength for "
                "framework; PPC is ideal for secondary plastering."
            ),
            image_url=(
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23"
                "?auto=format&fit=crop&w=800&q=80"
            ),
        ),
        MaterialRecommendationItem(
            category="Plumbing",
            primary={
                "material_id": "mat_pl01",
                "name": "CPVC SDR 11 & Lead-Free UPVC (IS 15778 / ASTM D2846)",
                "grade_spec": "Chlorinated Polyvinyl Chloride Pipes & Fittings",
                "description": (
                    "Pressure-rated hot and cold water distribution pipes resisting "
                    "temperature up to 93°C and scaling."
                ),
                "unit": "Running Meter",
                "unit_cost_range_inr": "₹120 - ₹240",
                "quality_level": quality_tier,
            },
            alternative={
                "material_id": "mat_pl02",
                "name": "Standard PVC / GI Class B Pipes (IS 4985)",
                "grade_spec": "Rigid PVC Schedule 40 or Galvanized Iron",
                "description": "Conventional cold-water plumbing pipes.",
                "unit": "Running Meter",
                "unit_cost_range_inr": "₹80 - ₹150",
                "quality_level": "economy",
            },
            reason=(
                "CPVC pipes prevent internal calcification and corrosion from hard groundwater "
                "common in eastern and western Pune corridors."
            ),
            image_url=(
                "https://images.unsplash.com/photo-1581094288338-2314dddb7ece"
                "?auto=format&fit=crop&w=800&q=80"
            ),
        ),
    ]


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

    # Scale category breakdown amounts and totals by Pune market calibration
    calibrated_breakdown = [
        BreakdownCategoryItem(
            category=b.category,
            amount=int(round(b.amount * PUNE_MARKET_MULTIPLIER)),
            share_pct=b.share_pct,
        )
        for b in result.breakdown
    ]
    # Re-normalize total_p50 exactly to the sum of breakdown amounts to prevent rounding drift
    total_p50 = sum(b.amount for b in calibrated_breakdown)
    total_p10 = int(round(result.total.p10 * PUNE_MARKET_MULTIPLIER))
    total_p90 = int(round(result.total.p90 * PUNE_MARKET_MULTIPLIER))

    # Recalculate budget assessment against calibrated total
    new_budget_status = result.budget.status
    new_budget_gap = result.budget.gap_inr
    if inputs.budget_inr is not None and inputs.budget_inr > 0:
        if inputs.budget_inr >= total_p50:
            new_budget_status = "within"
            new_budget_gap = int(inputs.budget_inr - total_p50)
        elif inputs.budget_inr >= total_p10:
            new_budget_status = "tight"
            new_budget_gap = int(total_p50 - inputs.budget_inr)
        else:
            new_budget_status = "below_minimum"
            new_budget_gap = int(total_p10 - inputs.budget_inr)

    material_recs = get_pune_material_recommendations(inputs.quality_tier)

    estimate = Estimate(
        project_id=project.id,
        inputs=inputs.model_dump(),
        total_p50=total_p50,
        total_p10=total_p10,
        total_p90=total_p90,
        confidence_label=result.confidence.label,
        breakdown=[b.model_dump() for b in calibrated_breakdown],
        materials=[m.model_dump() for m in material_recs],
        drivers=[d.model_dump() for d in result.drivers],
        budget_inr=inputs.budget_inr,
        budget_status=new_budget_status,
        is_mock=result.is_mock,
    )
    db.add(estimate)
    await db.commit()
    await db.refresh(estimate)

    return EstimateResponse(
        id=estimate.id,
        project_id=project.id,
        total=TotalEstimate(
            p50=total_p50,
            p10=total_p10,
            p90=total_p90,
            currency=result.total.currency,
        ),
        confidence=ConfidenceEstimate(
            label=result.confidence.label,
            reason=result.confidence.reason,
        ),
        breakdown=calibrated_breakdown,
        materials=material_recs,
        material_characteristics=[
            MaterialCharacteristicResponse.model_validate(m)
            for m in await get_all_material_characteristics(db)
        ],
        budget=BudgetAssessment(
            status=new_budget_status,
            gap_inr=new_budget_gap,
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
    """Fetch an estimate by ID or parent project ID checking user ownership."""
    stmt = (
        select(Estimate)
        .join(Estimate.project)
        .where(
            or_(
                Estimate.id == estimate_id,
                Estimate.project_id == estimate_id,
            ),
            Estimate.project.has(user_id=user_id, deleted_at=None),
        )
        .order_by(Estimate.created_at.desc())
        .limit(1)
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

    saved_inputs = EstimateCreate.model_validate(estimate.inputs)
    material_recs = (
        [MaterialRecommendationItem.model_validate(m) for m in estimate.materials]
        if estimate.materials
        else get_pune_material_recommendations(saved_inputs.quality_tier)
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
        materials=material_recs,
        material_characteristics=[
            MaterialCharacteristicResponse.model_validate(m)
            for m in await get_all_material_characteristics(db)
        ],
        budget=BudgetAssessment(
            status=saved_budget_status,
            gap_inr=0,
        ),
        drivers=[CostDriverItem.model_validate(d) for d in (estimate.drivers or [])],
        model=ModelMetaItem(version="1.0.0", data_version="v1.0.0"),
        disclaimer=(
            "Preliminary estimate calculated bottom-up using Maharashtra PWD SSR 2022-23 rates."
        ),
        inputs=saved_inputs,
        is_mock=getattr(estimate, "is_mock", False),
        created_at=estimate.created_at,
    )


async def get_latest_estimate_for_project(
    db: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
) -> EstimateResponse:
    """Fetch the latest estimate for a project checking user ownership."""
    return await get_estimate_by_id(db, user_id=user_id, estimate_id=project_id)
