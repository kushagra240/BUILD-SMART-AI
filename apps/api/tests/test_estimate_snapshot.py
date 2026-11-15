"""DB-free checks that a saved estimate row is served back verbatim.

The integration test in ``tests/test_estimates.py`` covers the same behaviour
over PostgreSQL. These unit tests keep the contract verifiable locally, where
no database is available: the saved ``gap_inr``, confidence reason, engine and
dataset versions and the disclaimer must come from the stored row instead of
hard-coded placeholders.
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.models.estimate import Estimate
from app.schemas.estimate import EstimateResponse
from app.services.estimation import get_estimate_by_id

STORED_INPUTS = {
    "built_up_area_sqft": 1500.0,
    "floors": 2,
    "bedrooms": 3,
    "bathrooms": 2,
    "zone_id": "ZN-PMC",
    "quality_tier": "standard",
    "construction_type": "rcc_framed",
    "plot_area_sqft": 2000.0,
    "budget_inr": 8000000,
}


def _saved_estimate(**overrides: object) -> Estimate:
    data: dict[str, object] = {
        "id": uuid.uuid4(),
        "project_id": uuid.uuid4(),
        "inputs": STORED_INPUTS,
        "total_p50": 7125000,
        "total_p10": 6412500,
        "total_p90": 8193750,
        "confidence_label": "Medium",
        "breakdown": [{"category": "Structure", "amount": 2137500, "share_pct": 30.0}],
        "materials": [],
        "drivers": [{"label": "Structure", "impact_pct": 30.0}],
        "budget_inr": 8000000,
        "budget_status": "within",
        "gap_inr": 875000,
        "confidence_reason": "Stored reason from the engine.",
        "engine_version": "stored-engine-1.2.3",
        "dataset_version": "stored-dataset-4.5.6",
        "disclaimer": "Stored disclaimer text.",
        "is_mock": False,
        "created_at": datetime.now(UTC),
    }
    data.update(overrides)
    return Estimate(**data)


async def _fetch(estimate: Estimate) -> EstimateResponse:
    result = MagicMock()
    result.scalar_one_or_none.return_value = estimate
    db = AsyncMock()
    db.execute.return_value = result
    with patch(
        "app.services.estimation.get_all_material_characteristics",
        new=AsyncMock(return_value=[]),
    ):
        return await get_estimate_by_id(db, uuid.uuid4(), estimate.id)


@pytest.mark.asyncio
async def test_saved_estimate_serves_stored_traceability_fields() -> None:
    estimate = _saved_estimate()

    response = await _fetch(estimate)

    assert response.id == estimate.id
    assert response.budget.status == "within"
    assert response.budget.gap_inr == 875000
    assert response.confidence.reason == "Stored reason from the engine."
    assert response.model.version == "stored-engine-1.2.3"
    assert response.model.data_version == "stored-dataset-4.5.6"
    assert response.disclaimer == "Stored disclaimer text."


@pytest.mark.asyncio
async def test_row_saved_before_traceability_columns_still_serves_sane_values() -> None:
    estimate = _saved_estimate(
        gap_inr=None,
        confidence_reason=None,
        engine_version=None,
        dataset_version=None,
        disclaimer=None,
    )

    response = await _fetch(estimate)

    # The budget gap is recomputed from the stored totals, not zeroed out.
    assert response.budget.gap_inr == 875000
    assert "Saved estimate" in response.confidence.reason
    assert response.model.version == "unknown"
    assert response.model.data_version == "unknown"
    assert "Maharashtra PWD SSR 2022-23" in response.disclaimer
