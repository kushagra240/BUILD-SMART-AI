import uuid
from typing import Any, Literal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

# OBVIOUSLY FAKE ROUND PLACEHOLDERS FOR PHASE 2 DEV STUB ONLY
# Per README §2 Non-Negotiable Core Rules: No Invented Data.
# Real rates, ML predictions, and real material specs will be loaded in Phase 3/4.
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

MOCK_BASE_TIER_RATES = {
    "economy": 1000,
    "standard": 2000,
    "premium": 3000,
}

MOCK_ZONE_MULTIPLIERS = {
    "pune_central": 1.0,
    "pune_east": 1.0,
    "pune_west": 1.0,
    "pcmc": 1.0,
    "pune_south_peripheral": 1.0,
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
    is_mock: bool = True,
) -> EstimateResponse:
    """Run stubbed estimation logic and record an immutable Estimate row in DB.

    When is_mock is False, stub placeholders MUST NOT be reachable.
    """
    if not is_mock:
        raise RuntimeError(
            "Mock stub estimation numbers are unreachable when is_mock is False. "
            "Real ML estimation pipeline must be used for non-mock estimates."
        )

    # Ensure project exists and is owned by user
    project = await project_service.get_project_by_id(db, user_id, project_id)

    # Calculate mock base total using obviously fake round placeholders
    base_rate = MOCK_BASE_TIER_RATES.get(inputs.quality_tier, 2000)
    zone_mult = MOCK_ZONE_MULTIPLIERS.get(inputs.zone_id, 1.0)
    floor_mult = 1.0

    unit_rate = int(base_rate * zone_mult * floor_mult)
    total_p50 = int(inputs.built_up_area_sqft * unit_rate)
    total_p10 = int(total_p50 * 0.80)
    total_p90 = int(total_p50 * 1.20)

    breakdown_list = calculate_mock_breakdown(total_p50)

    # Obviously fake round placeholder materials (no real brands or fabricated rates)
    materials_list: list[dict[str, Any]] = [
        {
            "category": "cement",
            "primary": {
                "name": "[MOCK STUB] Generic Placeholder Cement A",
                "grade": "MOCK-OPC-53",
                "unit_rate_inr": 100,
            },
            "alternative": {
                "name": "[MOCK STUB] Generic Placeholder Cement B",
                "grade": "MOCK-PPC",
                "unit_rate_inr": 100,
            },
            "reason": "[MOCK STUB] DEV MODEL: synthetic data, not validated",
        },
        {
            "category": "steel",
            "primary": {
                "name": "[MOCK STUB] Generic Placeholder Steel Fe500",
                "grade": "MOCK-Fe500",
                "unit_rate_inr": 10000,
            },
            "alternative": {
                "name": "[MOCK STUB] Generic Placeholder Steel Fe415",
                "grade": "MOCK-Fe415",
                "unit_rate_inr": 10000,
            },
            "reason": "[MOCK STUB] DEV MODEL: synthetic data, not validated",
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
        {"label": f"Quality Tier ({inputs.quality_tier.title()})", "impact_pct": 50.0},
        {"label": f"Built-up Area ({inputs.built_up_area_sqft:.0f} sqft)", "impact_pct": 30.0},
        {"label": f"Floors Count ({inputs.floors})", "impact_pct": 20.0},
    ]

    disclaimer_str = (
        "[MOCK STUB] DEV MODEL: synthetic data, not validated. "
        "This is a preliminary cost estimation produced by BuildSmart AI "
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
        is_mock=True,
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
            reason="[MOCK STUB] DEV MODEL: synthetic data, not validated.",
        ),
        breakdown=[BreakdownCategoryItem.model_validate(b) for b in breakdown_list],
        materials=[MaterialRecommendationItem.model_validate(m) for m in materials_list],
        budget=BudgetAssessment(status=budget_status, gap_inr=gap_inr),
        drivers=[CostDriverItem.model_validate(d) for d in drivers_list],
        model=ModelMetaItem(version="DEV-MOCK-v0.0", data_version="DEV-SYNTHETIC-v0.0"),
        disclaimer=disclaimer_str,
        inputs=inputs,
        is_mock=True,
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
            reason="[MOCK STUB] DEV MODEL: synthetic data, not validated.",
        ),
        breakdown=[BreakdownCategoryItem.model_validate(b) for b in estimate.breakdown],
        materials=[MaterialRecommendationItem.model_validate(m) for m in estimate.materials],
        budget=BudgetAssessment(
            status=saved_budget_status,
            gap_inr=0,
        ),
        drivers=[CostDriverItem.model_validate(d) for d in (estimate.drivers or [])],
        model=ModelMetaItem(version="DEV-MOCK-v0.0", data_version="DEV-SYNTHETIC-v0.0"),
        disclaimer="[MOCK STUB] DEV MODEL: synthetic data, not validated. Saved estimate snapshot.",
        inputs=EstimateCreate.model_validate(estimate.inputs),
        is_mock=getattr(estimate, "is_mock", True),
        created_at=estimate.created_at,
    )
