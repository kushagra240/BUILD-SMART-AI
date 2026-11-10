import uuid
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.calculator import calculate_estimate
from app.engine.contracts import EstimationInput
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
