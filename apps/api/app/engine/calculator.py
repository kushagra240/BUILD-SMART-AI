"""Bottom-up construction cost estimation engine for Pune residential buildings.

Contract C3: Implements bottom-up estimation using Maharashtra PWD SSR 2022-23 rates.
Decision D-01: Bottom-up quantity surveyor costing is primary.
Decision D-02: 8 non-labour categories contain material/machinery components;
               Labour category contains sum of all labour components across all items.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.contracts import (
    BOQLineItem,
    BudgetAssessment,
    CategoryBreakdown,
    ConfidenceInfo,
    CostDriver,
    EstimationInput,
    EstimationResult,
    MissingDataError,
    TotalCost,
)
from app.rates.repository import (
    get_active_dataset_version,
    get_labour_rate,
    get_work_item,
    get_zone,
)
from app.rates.schemas import LabourRateRecord, WorkItemRecord

# The 9 exact categories agreed across the system
CATEGORIES: list[str] = [
    "Foundation",
    "Structure",
    "Masonry",
    "Roofing",
    "Flooring",
    "Plumbing",
    "Electrical",
    "Finishing",
    "Labour",
]

# Square feet to square meters conversion factor
SQFT_TO_SQM: float = 0.092903

# Required SSR work item numbers
SSR_ITEMS: dict[str, str] = {
    "excavation": "21.01",  # WI-0720 Foundation excavation
    "pcc": "24.01",  # WI-0827 PCC in foundation
    "rcc": "25.11",  # WI-0836 RCC M-20 in structure
    "steel": "26.34",  # WI-0872 TMT steel reinforcement
    "brickwork": "27.01",  # WI-0889 Burnt brick masonry CM 1:6
    "roofing": "38.01",  # WI-1141 Roofing and ceiling
    "flooring": "33.01",  # WI-0988 Flooring and dado
    "plumbing": "41.01",  # WI-1302 Water supply and drainage piping
    "finishing": "32.01",  # WI-0955 Cement plastering internal/external
}

TIER_MULTIPLIERS: dict[str, float] = {
    "economy": 1.0,
    "standard": 1.15,
    "premium": 1.35,
}


def _compute_quantities(
    built_up_area_sqft: float,
    floors: int,
    bedrooms: int,
    bathrooms: int,
) -> dict[str, float]:
    """Compute quantities from built-up area and floors.

    All formulas are strictly bounded engineering heuristics marked for civil engineer sign-off.
    """
    sqm = built_up_area_sqft * SQFT_TO_SQM
    footprint_sqm = sqm / max(floors, 1)

    # TODO(data): civil engineer review needed for excavation volume per footprint
    qty_excavation = round(footprint_sqm * 1.2 * 0.8, 3)

    # TODO(data): civil engineer review needed for PCC bed thickness (0.10m assumption)
    qty_pcc = round(footprint_sqm * 0.10, 3)

    # TODO(data): civil engineer review needed for RCC concrete volume index (0.18 m3/m2)
    qty_rcc = round(sqm * 0.18, 3)

    # TODO(data): civil engineer review needed for structural steel norm (80 kg/m3 RCC)
    qty_steel = round((qty_rcc * 80.0) / 1000.0, 3)

    # TODO(data): civil engineer review needed for brickwork wall volume per sq.m built-up
    qty_brickwork = round(sqm * 0.22, 3)

    # TODO(data): civil engineer review needed for roof slab waterproofing area
    qty_roofing = round(footprint_sqm * 1.15, 3)

    # TODO(data): civil engineer review needed for usable floor tile area ratio (0.80)
    qty_flooring = round(sqm * 0.80, 3)

    # TODO(data): civil engineer review needed for plumbing run length per bathroom/sqm
    qty_plumbing = round(sqm * 0.15 + (bathrooms * 12.0), 3)

    # TODO(data): civil engineer review needed for electrical installation mandays
    total_rooms = bedrooms + bathrooms + 2
    qty_electrician_days = round(max(3.0, (sqm / 25.0) + (total_rooms * 1.5)), 2)

    # TODO(data): civil engineer review needed for plaster and paint surface area factor (2.5x)
    qty_finishing = round(sqm * 2.5, 3)

    return {
        "excavation": qty_excavation,
        "pcc": qty_pcc,
        "rcc": qty_rcc,
        "steel": qty_steel,
        "brickwork": qty_brickwork,
        "roofing": qty_roofing,
        "flooring": qty_flooring,
        "plumbing": qty_plumbing,
        "electrician_days": qty_electrician_days,
        "finishing": qty_finishing,
    }


def _compute_floor_lift_multiplier(floors: int) -> float:
    """Calculate weighted average SSR floor lift multiplier for upper floors.

    Per SSR rules R04-R07: floor 1 = 1%, floor 2 = 2%, floor 3 = 3%, floor 4+ = 4%.
    """
    if floors <= 1:
        return 1.0
    upper_lifts = [min(f - 1, 4) * 0.01 for f in range(2, floors + 1)]
    avg_lift = sum(upper_lifts) / (floors - 1)
    upper_fraction = (floors - 1) / floors
    return 1.0 + (avg_lift * upper_fraction)


def _distribute_integer_breakdown(
    raw_category_amounts: dict[str, float],
    target_p50: int,
) -> list[CategoryBreakdown]:
    """Distribute target_p50 across 9 categories using largest-remainder rounding."""
    floored: dict[str, int] = {}
    remainders: list[tuple[float, str]] = []

    for cat in CATEGORIES:
        val = raw_category_amounts.get(cat, 0.0)
        floor_val = int(val)
        floored[cat] = floor_val
        remainders.append((val - floor_val, cat))

    diff = target_p50 - sum(floored.values())
    remainders.sort(key=lambda x: x[0], reverse=True)

    for i in range(diff):
        floored[remainders[i][1]] += 1

    breakdown: list[CategoryBreakdown] = []
    for cat in CATEGORIES:
        amt = floored[cat]
        share = round((amt / target_p50) * 100.0, 2) if target_p50 > 0 else 0.0
        breakdown.append(CategoryBreakdown(category=cat, amount=amt, share_pct=share))

    return breakdown


def _evaluate_budget(budget_inr: int | None, p50: int, p10: int) -> BudgetAssessment:
    """Assess budget feasibility against estimated cost variance."""
    if budget_inr is None:
        return BudgetAssessment(status="not_provided", gap_inr=0)
    if budget_inr >= p50:
        return BudgetAssessment(status="within", gap_inr=budget_inr - p50)
    if budget_inr >= p10:
        return BudgetAssessment(status="tight", gap_inr=p50 - budget_inr)
    return BudgetAssessment(status="below_minimum", gap_inr=p50 - budget_inr)


async def _fetch_required_rates(
    session: AsyncSession,
    zone_id: str,
) -> tuple[dict[str, WorkItemRecord], LabourRateRecord, str]:
    """Fetch and validate all required work items and labour rates for the zone."""
    zone = await get_zone(session, zone_id)
    if zone is None:
        raise MissingDataError([f"zone_id:{zone_id}"], f"Zone '{zone_id}' not found in database")

    missing: list[str] = []
    items: dict[str, WorkItemRecord] = {}
    for key, item_no in SSR_ITEMS.items():
        record = await get_work_item(session, item_no)
        if record is None:
            missing.append(f"work_item:{item_no}")
        else:
            items[key] = record

    labour = await get_labour_rate(session, "Electrician", zone_id)
    if labour is None:
        missing.append(f"labour_rate:Electrician:{zone_id}")

    if missing:
        raise MissingDataError(missing)

    ds_version = await get_active_dataset_version(session)
    dataset_version_str = ds_version.version_id if ds_version else "v1.0.0"

    assert labour is not None
    return items, labour, dataset_version_str


def _price_work_item(
    item: WorkItemRecord,
    category: str,
    quantity: float,
    tier_mult: float,
    lift_mult: float,
) -> tuple[BOQLineItem, float, float]:
    """Price a single work item and split into labour and non-labour components."""
    # Apply tier multiplier to architectural finishes, lift multiplier to upper work
    effective_tier = tier_mult if category in ("Flooring", "Finishing", "Plumbing") else 1.0
    effective_lift = lift_mult if category not in ("Foundation",) else 1.0

    unit_rate = float(item.completed_rate) * effective_tier * effective_lift
    labour_unit_rate = float(item.labour_rate) * effective_lift
    non_labour_unit_rate = max(0.0, unit_rate - labour_unit_rate)

    total_cost = round(quantity * unit_rate, 2)
    labour_cost = round(quantity * labour_unit_rate, 2)
    non_labour_cost = round(quantity * non_labour_unit_rate, 2)

    line = BOQLineItem(
        item_code=item.item_no,
        description=item.description,
        category=category,
        quantity=quantity,
        unit=item.unit or "unit",
        unit_rate=round(unit_rate, 2),
        labour_rate=round(labour_unit_rate, 2),
        non_labour_rate=round(non_labour_unit_rate, 2),
        total_cost=total_cost,
        labour_cost=labour_cost,
        non_labour_cost=non_labour_cost,
        source_id=item.source_id,
    )
    return line, non_labour_cost, labour_cost


def _build_cost_drivers(category_amounts: dict[str, float], total_p50: float) -> list[CostDriver]:
    """Identify top cost drivers by cost share."""
    sorted_cats = sorted(category_amounts.items(), key=lambda x: x[1], reverse=True)
    drivers: list[CostDriver] = []
    for cat, amt in sorted_cats[:3]:
        pct = round((amt / total_p50) * 100.0, 2) if total_p50 > 0 else 0.0
        drivers.append(CostDriver(label=f"{cat} works", impact_pct=pct))
    return drivers


async def calculate_estimate(
    session: AsyncSession,
    input_data: EstimationInput,
) -> EstimationResult:
    """Calculate bottom-up construction estimate for residential house in Pune.

    Resolves rates from database for zone, applies quantities and rate rules,
    splits labour per Decision D-02, and computes realistic P10/P50/P90 variance.
    """
    items, electrician_labour, dataset_version_str = await _fetch_required_rates(
        session, input_data.zone_id
    )

    quantities = _compute_quantities(
        input_data.built_up_area_sqft,
        input_data.floors,
        input_data.bedrooms,
        input_data.bathrooms,
    )

    tier_mult = TIER_MULTIPLIERS.get(input_data.quality_tier, 1.0)
    lift_mult = _compute_floor_lift_multiplier(input_data.floors)

    raw_category_costs: dict[str, float] = {cat: 0.0 for cat in CATEGORIES}
    line_items: list[BOQLineItem] = []

    # Map of assembly items to categories
    item_mappings: list[tuple[str, str, float]] = [
        ("excavation", "Foundation", quantities["excavation"]),
        ("pcc", "Foundation", quantities["pcc"]),
        ("rcc", "Structure", quantities["rcc"]),
        ("steel", "Structure", quantities["steel"]),
        ("brickwork", "Masonry", quantities["brickwork"]),
        ("roofing", "Roofing", quantities["roofing"]),
        ("flooring", "Flooring", quantities["flooring"]),
        ("plumbing", "Plumbing", quantities["plumbing"]),
        ("finishing", "Finishing", quantities["finishing"]),
    ]

    for key, cat, qty in item_mappings:
        line, non_labour, labour = _price_work_item(
            items[key], cat, qty, tier_mult, lift_mult
        )
        line_items.append(line)
        raw_category_costs[cat] += non_labour
        raw_category_costs["Labour"] += labour

    # Electrical: Sourced electrician wage + conduit/wiring allowance
    elec_days = quantities["electrician_days"]
    elec_daily_wage = float(electrician_labour.daily_rate)
    elec_labour = round(elec_days * elec_daily_wage, 2)
    # Materials allowance (wiring, switches, conduits) scaled by quality tier
    elec_materials = round(elec_days * 1200.0 * tier_mult, 2)
    elec_total = elec_labour + elec_materials

    elec_line = BOQLineItem(
        item_code="ELEC-01",
        description="Electrical wiring, switches, conduits and installation",
        category="Electrical",
        quantity=elec_days,
        unit="mandays",
        unit_rate=round(elec_total / elec_days, 2),
        labour_rate=round(elec_daily_wage, 2),
        non_labour_rate=round(elec_materials / elec_days, 2),
        total_cost=elec_total,
        labour_cost=elec_labour,
        non_labour_cost=elec_materials,
        source_id=electrician_labour.source_id,
    )
    line_items.append(elec_line)
    raw_category_costs["Electrical"] += elec_materials
    raw_category_costs["Labour"] += elec_labour

    # Compute overall totals
    total_p50 = int(round(sum(raw_category_costs.values())))
    total_p10 = int(round(total_p50 * 0.90))
    total_p90 = int(round(total_p50 * 1.15))

    breakdown = _distribute_integer_breakdown(raw_category_costs, total_p50)
    budget = _evaluate_budget(input_data.budget_inr, total_p50, total_p10)
    drivers = _build_cost_drivers(raw_category_costs, float(total_p50))

    confidence = ConfidenceInfo(
        label="Medium",
        reason=(
            "Calculated bottom-up from Maharashtra PWD SSR 2022-23 rates and minimum wage "
            f"notifications for {input_data.zone_id}. Quantities use standard residential "
            "engineering heuristics pending final civil engineer validation."
        ),
    )

    return EstimationResult(
        total=TotalCost(p50=total_p50, p10=total_p10, p90=total_p90, currency="INR"),
        confidence=confidence,
        breakdown=breakdown,
        line_items=line_items,
        budget=budget,
        drivers=drivers,
        engine_version="1.0.0",
        dataset_version=dataset_version_str,
        is_mock=False,
    )
