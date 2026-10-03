import uuid
from typing import Any, Literal

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
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# 9 category allocation percentages (sum = 100%)
STAGE_SHARES = {
    "Foundation": 12.0,
    "Structure": 25.0,
    "Masonry": 10.0,
    "Roofing": 8.0,
    "Flooring": 10.0,
    "Plumbing": 7.0,
    "Electrical": 8.0,
    "Finishing": 12.0,
    "Labour": 8.0,
}

BASE_TIER_RATES = {
    "economy": 1800,
    "standard": 2300,
    "premium": 3200,
}

ZONE_MULTIPLIERS = {
    "pune_central": 1.10,
    "pune_east": 1.00,
    "pune_west": 1.05,
    "pcmc": 0.98,
    "pune_south_peripheral": 0.95,
}


def calculate_mock_breakdown(total_p50: int) -> list[dict[str, Any]]:
    """Split P50 total into 9 categories using largest-remainder rounding to sum exactly to P50."""
    raw_amounts: dict[str, float] = {}
    floored_amounts: dict[str, int] = {}
    remainders: list[tuple[float, str]] = []

    for cat, share in STAGE_SHARES.items():
        exact = total_p50 * (share / 100.0)
        floored = int(exact)
        raw_amounts[cat] = exact
        floored_amounts[cat] = floored
        remainders.append((exact - floored, cat))

    remainder_sum = total_p50 - sum(floored_amounts.values())
    # Sort by largest fractional remainder
    remainders.sort(key=lambda x: x[0], reverse=True)

    for i in range(remainder_sum):
        cat = remainders[i][1]
        floored_amounts[cat] += 1

    result: list[dict[str, Any]] = []
    for cat, amount in floored_amounts.items():
        share_pct = round((amount / total_p50) * 100.0, 2)
        result.append(
            {
                "category": cat,
                "amount": amount,
                "share_pct": share_pct,
            }
        )

    return result


async def create_estimate_for_project(
    db: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    inputs: EstimateCreate,
) -> EstimateResponse:
    """Run stubbed estimation logic and record an immutable Estimate row in DB."""
    # Ensure project exists and is owned by user
    project = await project_service.get_project_by_id(db, user_id, project_id)

    # Calculate mock base total
    base_rate = BASE_TIER_RATES.get(inputs.quality_tier, 2300)
    zone_mult = ZONE_MULTIPLIERS.get(inputs.zone_id, 1.0)
    floor_mult = 1.0 + (inputs.floors - 1) * 0.04

    unit_rate = int(base_rate * zone_mult * floor_mult)
    total_p50 = int(inputs.built_up_area_sqft * unit_rate)
    total_p10 = int(total_p50 * 0.88)
    total_p90 = int(total_p50 * 1.15)

    breakdown_list = calculate_mock_breakdown(total_p50)

    # Stubbed materials
    materials_list: list[dict[str, Any]] = [
        {
            "category": "cement",
            "primary": {
                "name": "Ultratech Super PPC Cement",
                "grade": "PPC IS 1489",
                "unit_rate_inr": 380,
            },
            "alternative": {
                "name": "Ambuja Kawach Cement",
                "grade": "PPC IS 1489",
                "unit_rate_inr": 390,
            },
            "reason": f"Recommended for {inputs.quality_tier.title()} finish in Pune zone",
        },
        {
            "category": "steel",
            "primary": {
                "name": "Tata Tiscon 550D TMT Bars",
                "grade": "Fe550D IS 1786",
                "unit_rate_inr": 65000,
            },
            "alternative": {
                "name": "JSW Neosteel 550D",
                "grade": "Fe550D IS 1786",
                "unit_rate_inr": 64000,
            },
            "reason": "Ductile high-strength reinforcement steel for seismic safety",
        },
    ]

    # Budget assessment
    budget_status: Literal["within", "tight", "below_minimum", "not_provided"] = "not_provided"
    gap_inr: int = 0
    if inputs.budget_inr:
        if inputs.budget_inr >= total_p50:
            budget_status = "within"
            gap_inr = inputs.budget_inr - total_p50
        elif inputs.budget_inr >= total_p10:
            budget_status = "tight"
            gap_inr = total_p50 - inputs.budget_inr
        else:
            budget_status = "below_minimum"
            gap_inr = total_p50 - inputs.budget_inr

    drivers_list: list[dict[str, Any]] = [
        {"label": f"Quality Tier ({inputs.quality_tier.title()})", "impact_pct": 25.0},
        {"label": f"Built-up Area ({inputs.built_up_area_sqft:.0f} sqft)", "impact_pct": 55.0},
        {"label": f"Floors Count ({inputs.floors})", "impact_pct": 8.0},
    ]

    disclaimer_str = (
        "[MOCK STUB] This is a preliminary cost estimation produced by BuildSmart AI "
        "stubbed engine. It does not constitute a legal contractor quotation or "
        "civil engineering sign-off."
    )

    # Save immutable Estimate in database
    estimate = Estimate(
        project_id=project.id,
        inputs=inputs.model_dump(),
        total_p50=total_p50,
        total_p10=total_p10,
        total_p90=total_p90,
        confidence_label="Medium",
        breakdown=breakdown_list,
        materials=materials_list,
        drivers=drivers_list,
        budget_inr=inputs.budget_inr,
        budget_status=budget_status,
    )
    db.add(estimate)
    await db.commit()
    await db.refresh(estimate)

    return EstimateResponse(
        id=estimate.id,
        project_id=project.id,
        total=TotalEstimate(p50=total_p50, p10=total_p10, p90=total_p90, currency="INR"),
        confidence=ConfidenceEstimate(
            label="Medium",
            reason="[MOCK STUB] Based on rate-card rules for preliminary phase 2 test stub.",
        ),
        breakdown=[BreakdownCategoryItem.model_validate(b) for b in breakdown_list],
        materials=[MaterialRecommendationItem.model_validate(m) for m in materials_list],
        budget=BudgetAssessment(status=budget_status, gap_inr=gap_inr),
        drivers=[CostDriverItem.model_validate(d) for d in drivers_list],
        model=ModelMetaItem(version="v0.1-stub", data_version="pune-sor-v1-stub"),
        disclaimer=disclaimer_str,
        inputs=inputs,
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

    saved_confidence_label: Literal["High", "Medium", "Low"] = (
        estimate.confidence_label  # type: ignore[assignment]
    )
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
            reason="Saved estimate record",
        ),
        breakdown=[BreakdownCategoryItem.model_validate(b) for b in estimate.breakdown],
        materials=[MaterialRecommendationItem.model_validate(m) for m in estimate.materials],
        budget=BudgetAssessment(
            status=saved_budget_status,
            gap_inr=0,
        ),
        drivers=[CostDriverItem.model_validate(d) for d in (estimate.drivers or [])],
        model=ModelMetaItem(version="v0.1-stub", data_version="pune-sor-v1-stub"),
        disclaimer="[MOCK STUB] Saved estimate snapshot.",
        inputs=EstimateCreate.model_validate(estimate.inputs),
        created_at=estimate.created_at,
    )
