"""Unit tests for the read-only rates repository layer.

Tests run fully isolated using AsyncMock and SQLAlchemy Core statement inspection,
requiring no live PostgreSQL database instance.
"""

from datetime import date
from decimal import Decimal
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.dialects import postgresql

from app.rates import (
    RatesRepository,
    get_active_dataset_version,
    get_all_zones,
    get_labour_rate,
    get_material_rate,
    get_quantity_norms,
    get_rate_rule,
    get_work_item,
    get_zone,
)
from app.rates.tables import (
    dataset_version,
    labour_rate_ssr,
    material_rate_ssr,
    minimum_wage,
    quantity_norm,
    rate_rule,
    work_item_ssr,
    zone as zone_table,
)


def _make_mock_result(
    row: dict[str, Any] | None = None,
    rows: list[dict[str, Any]] | None = None,
    scalar: Any = None,
) -> MagicMock:
    """Helper to create a mock SQLAlchemy Result with .mappings() and .scalar_one_or_none()."""
    mock_result = MagicMock()
    mock_mappings = MagicMock()
    if rows is not None:
        mock_mappings.all.return_value = rows
        mock_mappings.first.return_value = rows[0] if rows else None
    elif row is not None:
        mock_mappings.all.return_value = [row]
        mock_mappings.first.return_value = row
    else:
        mock_mappings.all.return_value = []
        mock_mappings.first.return_value = None

    mock_result.mappings.return_value = mock_mappings
    mock_result.scalar_one_or_none.return_value = scalar
    return mock_result


# --- Work Item Tests ---


@pytest.mark.asyncio
async def test_get_work_item_by_id() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        row={
            "work_item_id": "WI-0001",
            "ssr_sr": 1,
            "item_no": "21.01",
            "ref_no": "SSR-2022-21.01",
            "description": "Excavation in earth, soils of all kinds",
            "unit": "cum",
            "completed_rate": Decimal("185.50"),
            "labour_rate": Decimal("75.20"),
            "ssr_page": 210,
            "pdf_page": 217,
            "parse_status": "OK",
            "chapter_no": 21,
            "chapter_name": "Earthwork",
            "source_id": "SRC-01",
            "basis": "SSR 2022-23",
        }
    )

    item = await get_work_item(session, "WI-0001")
    assert item is not None
    assert item.work_item_id == "WI-0001"
    assert item.item_no == "21.01"
    assert item.completed_rate == Decimal("185.50")
    assert item.labour_rate == Decimal("75.20")
    assert item.non_labour_rate == Decimal("110.30")
    assert item.labour_share == Decimal("0.4054")
    assert item.parse_status == "OK"


@pytest.mark.asyncio
async def test_get_work_item_by_item_no() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        row={
            "work_item_id": "WI-0720",
            "ssr_sr": 720,
            "item_no": "24.03",
            "ref_no": None,
            "description": "Providing and laying in situ M-20 RCC",
            "unit": "cum",
            "completed_rate": Decimal("5620.00"),
            "labour_rate": Decimal("1240.00"),
            "ssr_page": 312,
            "pdf_page": 319,
            "parse_status": "OK",
            "chapter_no": 24,
            "chapter_name": "Reinforced Cement Concrete",
            "source_id": "SRC-01",
            "basis": "SSR 2022-23",
        }
    )

    item = await get_work_item(session, "24.03")
    assert item is not None
    assert item.work_item_id == "WI-0720"
    assert item.item_no == "24.03"
    assert item.non_labour_rate == Decimal("4380.00")


@pytest.mark.asyncio
async def test_get_work_item_not_found() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(row=None)

    item = await get_work_item(session, "NON_EXISTENT")
    assert item is None


@pytest.mark.asyncio
async def test_get_work_item_empty_input() -> None:
    session = AsyncMock()
    item = await get_work_item(session, "   ")
    assert item is None
    session.execute.assert_not_called()


# --- Material Rate Tests ---


@pytest.mark.asyncio
async def test_get_material_rate_found() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        row={
            "material_id": "MAT-0001",
            "section": "Building Materials",
            "sr": "1",
            "material": "Cement OPC 43 grade",
            "unit": "bag",
            "rate": Decimal("350.00"),
            "ssr_page": 510,
            "pdf_page": 517,
            "source_id": "SRC-01",
            "basis": "SSR 2022-23",
            "status": "READ",
            "unit_norm": "bag",
            "row_quality": "OK",
            "is_building_relevant": True,
        }
    )

    mat = await get_material_rate(session, "MAT-0001")
    assert mat is not None
    assert mat.material_id == "MAT-0001"
    assert mat.material == "Cement OPC 43 grade"
    assert mat.rate == Decimal("350.00")
    assert mat.unit == "bag"
    assert mat.is_building_relevant is True


@pytest.mark.asyncio
async def test_get_material_rate_not_found() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(row=None)

    mat = await get_material_rate(session, "MAT-9999")
    assert mat is None


@pytest.mark.asyncio
async def test_get_material_rate_empty_input() -> None:
    session = AsyncMock()
    mat = await get_material_rate(session, "")
    assert mat is None
    session.execute.assert_not_called()


# --- Labour Rate Tests ---


@pytest.mark.asyncio
async def test_get_labour_rate_with_zone() -> None:
    """When zone_id is provided, resolve zone and return applicable minimum wage."""
    session = AsyncMock()
    # 1. labour_rate_ssr lookup
    ssr_res = _make_mock_result(
        row={
            "ssr_sr": 3,
            "trade": "Mason I Class Skilled",
            "unit": "Day",
            "rate_2022_23": Decimal("677.00"),
            "ssr_page": 545,
            "pdf_page": 552,
            "source_id": "SRC-01",
            "status": "READ",
            "unit_norm": "day",
        }
    )
    # 2. zone lookup: ZN-PMC -> min_wage_zone = "I"
    zone_res = _make_mock_result(scalar="I")
    # 3. minimum_wage lookup for Zone I, Skilled
    mw_res = _make_mock_result(
        row={
            "daily_rate": Decimal("963.77"),
            "basic_source_id": "SRC-02",
        }
    )
    session.execute.side_effect = [ssr_res, zone_res, mw_res]

    labour = await get_labour_rate(session, "Mason I Class Skilled", zone_id="ZN-PMC")
    assert labour is not None
    assert labour.trade == "Mason I Class Skilled"
    assert labour.daily_rate == Decimal("963.77")
    assert labour.min_wage_rate == Decimal("963.77")
    assert labour.ssr_rate == Decimal("677.00")
    assert labour.skill_class == "Skilled"
    assert labour.zone_id == "ZN-PMC"
    assert labour.min_wage_zone == "I"
    assert labour.source_id == "SRC-02"


@pytest.mark.asyncio
async def test_get_labour_rate_without_zone() -> None:
    """Without zone_id, return SSR statewide daily rate."""
    session = AsyncMock()
    ssr_res = _make_mock_result(
        row={
            "ssr_sr": 3,
            "trade": "Mason I Class Skilled",
            "unit": "Day",
            "rate_2022_23": Decimal("677.00"),
            "ssr_page": 545,
            "pdf_page": 552,
            "source_id": "SRC-01",
            "status": "READ",
            "unit_norm": "day",
        }
    )
    session.execute.return_value = ssr_res

    labour = await get_labour_rate(session, "Mason I Class Skilled")
    assert labour is not None
    assert labour.trade == "Mason I Class Skilled"
    assert labour.daily_rate == Decimal("677.00")
    assert labour.ssr_rate == Decimal("677.00")
    assert labour.min_wage_rate is None
    assert labour.skill_class == "Skilled"
    assert labour.source_id == "SRC-01"


@pytest.mark.asyncio
async def test_get_labour_rate_direct_skill_name() -> None:
    """Direct skill name (e.g. 'Skilled', 'Unskilled') with zone."""
    session = AsyncMock()
    rep_res = _make_mock_result(
        row={
            "ssr_sr": 3,
            "trade": "Mason I Class Skilled",
            "unit": "Day",
            "rate_2022_23": Decimal("677.00"),
            "ssr_page": 545,
            "pdf_page": 552,
            "source_id": "SRC-01",
            "status": "READ",
            "unit_norm": "day",
        }
    )
    zone_res = _make_mock_result(scalar="I")
    mw_res = _make_mock_result(
        row={
            "daily_rate": Decimal("963.77"),
            "basic_source_id": "SRC-02",
        }
    )
    session.execute.side_effect = [rep_res, zone_res, mw_res]

    labour = await get_labour_rate(session, "Skilled", zone_id="ZN-PMC")
    assert labour is not None
    assert labour.skill_class == "Skilled"
    assert labour.daily_rate == Decimal("963.77")


@pytest.mark.asyncio
async def test_get_labour_rate_not_found() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(row=None)

    labour = await get_labour_rate(session, "Astronaut")
    assert labour is None


# --- Quantity Norm Tests ---


@pytest.mark.asyncio
async def test_get_quantity_norms_found() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        rows=[
            {
                "norm_id": "QN-0003",
                "category": "Plain Cement Concrete",
                "sr": 1,
                "item": "Plain cement concrete 1:5:10",
                "item_unit": "M3",
                "material": "Cement",
                "qty": Decimal("2.6000"),
                "material_unit": "bag",
                "ssr_page": 567,
                "pdf_page": 574,
                "parse_status": "OK",
                "source_id": "SRC-01",
                "table_title": "Theoretical requirement of materials",
            },
            {
                "norm_id": "QN-0004",
                "category": "Plain Cement Concrete",
                "sr": 1,
                "item": "Plain cement concrete 1:5:10",
                "item_unit": "M3",
                "material": "Screened sand",
                "qty": Decimal("0.4700"),
                "material_unit": "m3",
                "ssr_page": 567,
                "pdf_page": 574,
                "parse_status": "OK",
                "source_id": "SRC-01",
                "table_title": "Theoretical requirement of materials",
            },
        ]
    )

    norms = await get_quantity_norms(session, "Plain cement concrete 1:5:10")
    assert len(norms) == 2
    assert norms[0].norm_id == "QN-0003"
    assert norms[0].material == "Cement"
    assert norms[0].qty == Decimal("2.6000")
    assert norms[1].material == "Screened sand"
    assert norms[1].qty == Decimal("0.4700")


@pytest.mark.asyncio
async def test_get_quantity_norms_empty() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(rows=[])

    norms = await get_quantity_norms(session, "Nonexistent Item")
    assert norms == []


@pytest.mark.asyncio
async def test_get_quantity_norms_empty_input() -> None:
    session = AsyncMock()
    norms = await get_quantity_norms(session, "")
    assert norms == []
    session.execute.assert_not_called()


# --- Rate Rules & Zone Tests ---


@pytest.mark.asyncio
async def test_get_rate_rule() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        row={
            "rule_id": "RR-FL-01",
            "kind": "floor_lift",
            "description": "Floor lift extra charge for 1st floor",
            "value": Decimal("1.0"),
            "unit": "percent",
            "reference": "SSR Note 3",
            "note": "Applicable above ground floor",
            "source_id": "SRC-01",
            "status": "READ",
        }
    )

    rule = await get_rate_rule(session, "RR-FL-01")
    assert rule is not None
    assert rule.rule_id == "RR-FL-01"
    assert rule.value == Decimal("1.0")


@pytest.mark.asyncio
async def test_get_zone() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        row={
            "zone_id": "ZN-PMC",
            "name": "Pune Municipal Corporation",
            "min_wage_zone": "I",
            "basis": "Municipal limits",
            "transport_lead_km_to_main_materials": Decimal("15.0"),
            "price_multiplier": None,
            "source_id": "SRC-02",
            "status": "READ",
        }
    )

    zone = await get_zone(session, "ZN-PMC")
    assert zone is not None
    assert zone.zone_id == "ZN-PMC"
    assert zone.min_wage_zone == "I"
    assert zone.price_multiplier is None


@pytest.mark.asyncio
async def test_get_all_zones() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        rows=[
            {
                "zone_id": "ZN-PMC",
                "name": "Pune Municipal Corporation",
                "min_wage_zone": "I",
                "basis": "Municipal limits",
                "transport_lead_km_to_main_materials": None,
                "price_multiplier": None,
                "source_id": "SRC-02",
                "status": "READ",
            },
            {
                "zone_id": "ZN-PCMC",
                "name": "Pimpri-Chinchwad Municipal Corporation",
                "min_wage_zone": "I",
                "basis": "Municipal limits",
                "transport_lead_km_to_main_materials": None,
                "price_multiplier": None,
                "source_id": "SRC-02",
                "status": "READ",
            },
        ]
    )

    zones = await get_all_zones(session)
    assert len(zones) == 2
    assert zones[0].zone_id == "ZN-PMC"
    assert zones[1].zone_id == "ZN-PCMC"


@pytest.mark.asyncio
async def test_get_active_dataset_version() -> None:
    session = AsyncMock()
    session.execute.return_value = _make_mock_result(
        row={
            "version_id": "v1.0.0",
            "label": "BuildSmart Rates v1.0.0",
            "created_on": date(2026, 11, 9),
            "price_basis": "SSR 2022-23 ex-GST",
            "notes": "Verified package",
            "is_active": True,
        }
    )

    ver = await get_active_dataset_version(session)
    assert ver is not None
    assert ver.version_id == "v1.0.0"
    assert ver.is_active is True


# --- SQL Dialect and Schema Target Verification ---


def test_sql_dialect_compilation() -> None:
    """Verify that all Core Table definitions target schema 'rates' and compile cleanly for Postgres."""
    dialect = postgresql.dialect()

    for table in [
        work_item_ssr,
        material_rate_ssr,
        labour_rate_ssr,
        quantity_norm,
        rate_rule,
        zone_table,
        minimum_wage,
        dataset_version,
    ]:
        assert table.schema == "rates"
        compiled = str(table.select().compile(dialect=dialect))
        assert "rates." in compiled
