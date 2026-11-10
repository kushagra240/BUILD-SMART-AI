import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.engine.calculator import calculate_estimate
from app.engine.contracts import EstimationInput, MissingDataError
from app.models.estimate import Estimate
from app.models.user import User
from app.schemas.estimate import (
    BreakdownCategoryItem,
    BudgetAssessment,
    ConfidenceEstimate,
    CostDriverItem,
    EstimateCreate,
    EstimateResponse,
    ModelMetaItem,
    TotalEstimate,
)
from app.services import estimation, project_service

router = APIRouter(tags=["Estimates"])


@router.post(
    "/projects/{project_id}/estimates",
    response_model=EstimateResponse,
    status_code=status.HTTP_200_OK,
)
async def create_estimate(
    project_id: uuid.UUID,
    req: EstimateCreate,
    is_mock: bool = Query(default=False, description="Whether to use mock stub engine"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EstimateResponse:
    """Create a new estimate snapshot for a project using the bottom-up engine.

    Validates inputs, passes the AsyncSession and EstimationInput to the calculator,
    catches MissingDataError raising HTTP 422 with MISSING_DATA details, and stores
    an immutable estimate record.
    """
    project = await project_service.get_project_by_id(db, current_user.id, project_id)

    engine_input = EstimationInput(
        built_up_area_sqft=req.built_up_area_sqft,
        floors=req.floors,
        bedrooms=req.bedrooms,
        bathrooms=req.bathrooms,
        zone_id=req.zone_id,
        quality_tier=req.quality_tier,
        construction_type=req.construction_type,
        plot_area_sqft=req.plot_area_sqft,
        budget_inr=req.budget_inr,
    )

    try:
        result = await calculate_estimate(db, engine_input)
    except MissingDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "MISSING_DATA",
                "message": str(exc),
                "missing_keys": exc.missing_keys,
            },
        ) from exc

    # Persist immutable estimate snapshot in database
    estimate = Estimate(
        project_id=project.id,
        inputs=req.model_dump(),
        total_p50=result.total.p50,
        total_p10=result.total.p10,
        total_p90=result.total.p90,
        confidence_label=result.confidence.label,
        breakdown=[b.model_dump() for b in result.breakdown],
        materials=[],
        drivers=[d.model_dump() for d in result.drivers],
        budget_inr=req.budget_inr,
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
        inputs=req,
        is_mock=result.is_mock,
        created_at=estimate.created_at,
    )


@router.get("/estimates/{estimate_id}", response_model=EstimateResponse)
async def get_estimate(
    estimate_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EstimateResponse:
    """Get an existing estimate snapshot by ID."""
    return await estimation.get_estimate_by_id(db, user_id=current_user.id, estimate_id=estimate_id)
