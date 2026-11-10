"""Unit tests for the bottom-up estimation engine calculator.

Tests run fully isolated using AsyncMock, verifying calculations,
labour split rules, category summation, and missing data failure paths.
"""

from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from app.engine.calculator import calculate_estimate
from app.engine.contracts import EstimationInput, MissingDataError
from app.rates.schemas import (
    DatasetVersionRecord,
    LabourRateRecord,
    WorkItemRecord,
    ZoneRecord,
)


def _make_dummy_work_item(
    item_no: str,
    desc: str,
    completed: Decimal,
    labour: Decimal,
    unit: str = "cum",
) -> WorkItemRecord:
    return WorkItemRecord(
        work_item_id=f"WI-{item_no}",
        ssr_sr=int(item_no.replace(".", "")),
        item_no=item_no,
        ref_no=None,
        description=desc,
        unit=unit,
        completed_rate=completed,
        labour_rate=labour,
        ssr_page=100,
        pdf_page=105,
        parse_status="OK",
        chapter_no=int(item_no.split(".", maxsplit=1)[0]),
        chapter_name="Test Chapter",
        source_id="SRC-01",
        basis="SSR 2022-23",
    )


def _mock_rates_environment() -> dict[str, WorkItemRecord]:
    return {
        "21.01": _make_dummy_work_item("21.01", "Excavation", Decimal("239.00"), Decimal("239.00")),
        "24.01": _make_dummy_work_item("24.01", "PCC bed", Decimal("5830.00"), Decimal("1616.00")),
        "25.11": _make_dummy_work_item("25.11", "RCC M-20", Decimal("7104.00"), Decimal("2110.00")),
        "26.34": _make_dummy_work_item(
            "26.34", "Steel reinforcement", Decimal("94136.00"), Decimal("11880.00"), "MT"
        ),
        "27.01": _make_dummy_work_item(
            "27.01", "Brickwork", Decimal("7755.00"), Decimal("1588.00")
        ),
        "38.01": _make_dummy_work_item(
            "38.01", "Roofing", Decimal("1183.00"), Decimal("148.00"), "sqm"
        ),
        "33.01": _make_dummy_work_item(
            "33.01", "Flooring", Decimal("731.00"), Decimal("291.00"), "sqm"
        ),
        "41.01": _make_dummy_work_item(
            "41.01", "Plumbing", Decimal("1317.00"), Decimal("126.00"), "Rm"
        ),
        "32.01": _make_dummy_work_item(
            "32.01", "Plastering", Decimal("203.00"), Decimal("166.00"), "sqm"
        ),
    }


@pytest.mark.asyncio
async def test_calculate_estimate_success() -> None:
    session = AsyncMock()
    items = _mock_rates_environment()

    dummy_zone = ZoneRecord(
        zone_id="ZN-PMC",
        name="Pune Municipal Corporation",
        min_wage_zone="I",
        basis="Urban",
        transport_lead_km_to_main_materials=Decimal("15.0"),
        price_multiplier=None,
        source_id="SRC-02",
        status="READ",
    )
    dummy_labour = LabourRateRecord(
        trade="Electrician",
        daily_rate=Decimal("963.77"),
        unit="day",
        ssr_rate=Decimal("677.00"),
        min_wage_rate=Decimal("963.77"),
        zone_id="ZN-PMC",
        min_wage_zone="I",
        skill_class="Skilled",
        source_id="SRC-02",
    )
    dummy_ds = DatasetVersionRecord(
        version_id="v1.0.0",
        label="Rates v1.0.0",
        created_on="2026-11-09",  # type: ignore[arg-type]
        price_basis="SSR 2022-23",
        notes=None,
        is_active=True,
    )

    with (
        patch("app.engine.calculator.get_zone", new=AsyncMock(return_value=dummy_zone)),
        patch(
            "app.engine.calculator.get_work_item",
            new=AsyncMock(side_effect=lambda _, code: items.get(code)),
        ),
        patch("app.engine.calculator.get_labour_rate", new=AsyncMock(return_value=dummy_labour)),
        patch(
            "app.engine.calculator.get_active_dataset_version",
            new=AsyncMock(return_value=dummy_ds),
        ),
    ):
        input_data = EstimationInput(
            built_up_area_sqft=1200.0,
            floors=2,
            bedrooms=3,
            bathrooms=2,
            zone_id="ZN-PMC",
            quality_tier="standard",
            budget_inr=3000000,
        )

        result = await calculate_estimate(session, input_data)

        assert result is not None
        assert result.total.p50 > 0
        assert result.total.p10 == int(round(result.total.p50 * 0.90))
        assert result.total.p90 == int(round(result.total.p50 * 1.15))
        assert result.is_mock is False
        assert result.dataset_version == "v1.0.0"

        # Check 9 exact categories
        category_names = [item.category for item in result.breakdown]
        expected_categories = [
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
        assert category_names == expected_categories

        # Categories sum exactly to total P50 without double counting
        breakdown_sum = sum(b.amount for b in result.breakdown)
        assert breakdown_sum == result.total.p50

        # Check line items and cost drivers
        assert len(result.line_items) == 10
        assert len(result.drivers) == 3
        assert result.budget.status in ("within", "tight", "below_minimum")


@pytest.mark.asyncio
async def test_calculate_estimate_missing_zone_failure() -> None:
    session = AsyncMock()

    with patch("app.engine.calculator.get_zone", new=AsyncMock(return_value=None)):
        input_data = EstimationInput(
            built_up_area_sqft=1000.0,
            floors=1,
            bedrooms=2,
            bathrooms=1,
            zone_id="ZN-UNKNOWN",
            quality_tier="economy",
        )

        with pytest.raises(MissingDataError) as exc_info:
            await calculate_estimate(session, input_data)

        assert "zone_id:ZN-UNKNOWN" in exc_info.value.missing_keys


@pytest.mark.asyncio
async def test_calculate_estimate_missing_work_item_failure() -> None:
    session = AsyncMock()
    dummy_zone = ZoneRecord(
        zone_id="ZN-PMC",
        name="Pune",
        min_wage_zone="I",
        source_id="SRC-02",
        status="READ",
    )

    with (
        patch("app.engine.calculator.get_zone", new=AsyncMock(return_value=dummy_zone)),
        patch("app.engine.calculator.get_work_item", new=AsyncMock(return_value=None)),
        patch("app.engine.calculator.get_labour_rate", new=AsyncMock(return_value=None)),
        patch("app.engine.calculator.get_active_dataset_version", new=AsyncMock(return_value=None)),
    ):
        input_data = EstimationInput(
            built_up_area_sqft=1000.0,
            floors=1,
            bedrooms=2,
            bathrooms=1,
            zone_id="ZN-PMC",
            quality_tier="economy",
        )

        with pytest.raises(MissingDataError) as exc_info:
            await calculate_estimate(session, input_data)

        assert any("work_item:" in key for key in exc_info.value.missing_keys)


@pytest.mark.asyncio
async def test_calculate_estimate_quality_tier_scaling() -> None:
    session = AsyncMock()
    items = _mock_rates_environment()

    dummy_zone = ZoneRecord(
        zone_id="ZN-PMC",
        name="Pune",
        min_wage_zone="I",
        source_id="SRC-02",
        status="READ",
    )
    dummy_labour = LabourRateRecord(
        trade="Electrician",
        daily_rate=Decimal("963.77"),
        unit="day",
        source_id="SRC-02",
    )

    with (
        patch("app.engine.calculator.get_zone", new=AsyncMock(return_value=dummy_zone)),
        patch(
            "app.engine.calculator.get_work_item",
            new=AsyncMock(side_effect=lambda _, code: items.get(code)),
        ),
        patch("app.engine.calculator.get_labour_rate", new=AsyncMock(return_value=dummy_labour)),
        patch(
            "app.engine.calculator.get_active_dataset_version",
            new=AsyncMock(return_value=None),
        ),
    ):
        econ_input = EstimationInput(
            built_up_area_sqft=1000.0,
            floors=1,
            bedrooms=2,
            bathrooms=1,
            zone_id="ZN-PMC",
            quality_tier="economy",
        )
        prem_input = EstimationInput(
            built_up_area_sqft=1000.0,
            floors=1,
            bedrooms=2,
            bathrooms=1,
            zone_id="ZN-PMC",
            quality_tier="premium",
        )

        econ_res = await calculate_estimate(session, econ_input)
        prem_res = await calculate_estimate(session, prem_input)

        # Premium tier costs more than economy tier
        assert prem_res.total.p50 > econ_res.total.p50


@pytest.mark.asyncio
async def test_calculate_estimate_budget_assessment() -> None:
    session = AsyncMock()
    items = _mock_rates_environment()

    dummy_zone = ZoneRecord(
        zone_id="ZN-PMC",
        name="Pune",
        min_wage_zone="I",
        source_id="SRC-02",
        status="READ",
    )
    dummy_labour = LabourRateRecord(
        trade="Electrician",
        daily_rate=Decimal("963.77"),
        unit="day",
        source_id="SRC-02",
    )

    with (
        patch("app.engine.calculator.get_zone", new=AsyncMock(return_value=dummy_zone)),
        patch(
            "app.engine.calculator.get_work_item",
            new=AsyncMock(side_effect=lambda _, code: items.get(code)),
        ),
        patch("app.engine.calculator.get_labour_rate", new=AsyncMock(return_value=dummy_labour)),
        patch(
            "app.engine.calculator.get_active_dataset_version",
            new=AsyncMock(return_value=None),
        ),
    ):
        # 1. Without budget
        res_no_budget = await calculate_estimate(
            session,
            EstimationInput(
                built_up_area_sqft=1000.0,
                floors=1,
                bedrooms=2,
                bathrooms=1,
                zone_id="ZN-PMC",
                quality_tier="economy",
                budget_inr=None,
            ),
        )
        assert res_no_budget.budget.status == "not_provided"

        # 2. Generous budget (within)
        res_within = await calculate_estimate(
            session,
            EstimationInput(
                built_up_area_sqft=1000.0,
                floors=1,
                bedrooms=2,
                bathrooms=1,
                zone_id="ZN-PMC",
                quality_tier="economy",
                budget_inr=res_no_budget.total.p50 + 500000,
            ),
        )
        assert res_within.budget.status == "within"
        assert res_within.budget.gap_inr == 500000

        # 3. Below minimum budget
        res_below = await calculate_estimate(
            session,
            EstimationInput(
                built_up_area_sqft=1000.0,
                floors=1,
                bedrooms=2,
                bathrooms=1,
                zone_id="ZN-PMC",
                quality_tier="economy",
                budget_inr=res_no_budget.total.p10 - 200000,
            ),
        )
        assert res_below.budget.status == "below_minimum"
        assert res_below.budget.gap_inr > 0


@pytest.mark.asyncio
async def test_calculate_estimate_material_recommendations_by_tier() -> None:
    session = AsyncMock()
    items = _mock_rates_environment()

    dummy_zone = ZoneRecord(
        zone_id="ZN-PMC",
        name="Pune",
        min_wage_zone="I",
        source_id="SRC-02",
        status="READ",
    )
    dummy_labour = LabourRateRecord(
        trade="Electrician",
        daily_rate=Decimal("963.77"),
        unit="day",
        source_id="SRC-02",
    )

    with (
        patch("app.engine.calculator.get_zone", new=AsyncMock(return_value=dummy_zone)),
        patch(
            "app.engine.calculator.get_work_item",
            new=AsyncMock(side_effect=lambda _, code: items.get(code)),
        ),
        patch("app.engine.calculator.get_labour_rate", new=AsyncMock(return_value=dummy_labour)),
        patch(
            "app.engine.calculator.get_active_dataset_version",
            new=AsyncMock(return_value=None),
        ),
    ):
        for tier in ("economy", "standard", "premium"):
            res = await calculate_estimate(
                session,
                EstimationInput(
                    built_up_area_sqft=1000.0,
                    floors=1,
                    bedrooms=2,
                    bathrooms=1,
                    zone_id="ZN-PMC",
                    quality_tier=tier,
                ),
            )
            assert len(res.materials) == 5
            categories = [m.category for m in res.materials]
            assert categories == ["Cement", "Steel", "Masonry", "Flooring", "Plumbing"]

        econ_res = await calculate_estimate(
            session,
            EstimationInput(
                built_up_area_sqft=1000.0,
                floors=1,
                bedrooms=2,
                bathrooms=1,
                zone_id="ZN-PMC",
                quality_tier="economy",
            ),
        )
        prem_res = await calculate_estimate(
            session,
            EstimationInput(
                built_up_area_sqft=1000.0,
                floors=1,
                bedrooms=2,
                bathrooms=1,
                zone_id="ZN-PMC",
                quality_tier="premium",
            ),
        )

        econ_steel = next(m for m in econ_res.materials if m.category == "Steel")
        prem_steel = next(m for m in prem_res.materials if m.category == "Steel")
        assert "500 Standard" in str(econ_steel.primary["name"])
        assert "550D" in str(prem_steel.primary["name"])

