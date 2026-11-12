"""API route tests for POST /api/v1/projects/{project_id}/estimates.

Verifies wiring between FastAPI route, AsyncSession, EstimationInput,
the calculation engine, 422 MissingDataError handling, and DB snapshot storage.
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from app.engine.contracts import (
    BudgetAssessment,
    CategoryBreakdown,
    ConfidenceInfo,
    CostDriver,
    EstimationResult,
    MissingDataError,
    TotalCost,
)
from httpx import AsyncClient


def _dummy_engine_result() -> EstimationResult:
    return EstimationResult(
        total=TotalCost(p50=2500000, p10=2250000, p90=2875000, currency="INR"),
        confidence=ConfidenceInfo(
            label="Medium",
            reason="Calculated bottom-up from Maharashtra PWD SSR 2022-23 rates.",
        ),
        breakdown=[
            CategoryBreakdown(category="Foundation", amount=250000, share_pct=10.0),
            CategoryBreakdown(category="Structure", amount=750000, share_pct=30.0),
            CategoryBreakdown(category="Masonry", amount=250000, share_pct=10.0),
            CategoryBreakdown(category="Roofing", amount=150000, share_pct=6.0),
            CategoryBreakdown(category="Flooring", amount=200000, share_pct=8.0),
            CategoryBreakdown(category="Plumbing", amount=150000, share_pct=6.0),
            CategoryBreakdown(category="Electrical", amount=175000, share_pct=7.0),
            CategoryBreakdown(category="Finishing", amount=325000, share_pct=13.0),
            CategoryBreakdown(category="Labour", amount=250000, share_pct=10.0),
        ],
        line_items=[],
        budget=BudgetAssessment(status="within", gap_inr=500000),
        drivers=[
            CostDriver(label="Structure", impact_pct=30.0),
            CostDriver(label="Finishing", impact_pct=13.0),
            CostDriver(label="Foundation", impact_pct=10.0),
        ],
        engine_version="1.0.0",
        dataset_version="v1.0.0",
        is_mock=False,
    )


async def _get_auth_header(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "StrongPassword123!", "full_name": "Route Test User"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPassword123!"},
    )
    return {"Authorization": f"Bearer {login_res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_create_estimate_route_success(client: AsyncClient) -> None:
    headers = await _get_auth_header(client, "route_tester@example.com")

    # Create project first
    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "Kothrud Bungalow"},
        headers=headers,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    est_payload = {
        "built_up_area_sqft": 1500.0,
        "floors": 2,
        "bedrooms": 3,
        "bathrooms": 2,
        "zone_id": "ZN-PMC",
        "quality_tier": "standard",
        "construction_type": "rcc_framed",
        "plot_area_sqft": 2000.0,
        "budget_inr": 3000000,
    }

    mock_result = _dummy_engine_result()
    with (
        patch(
            "app.api.v1.estimates.calculate_estimate",
            new=AsyncMock(return_value=mock_result),
        ) as mock_engine,
        patch("app.services.estimation.predict_variance", return_value=0.10) as mock_ml,
    ):
        est_res = await client.post(
            f"/api/v1/projects/{proj_id}/estimates",
            json=est_payload,
            headers=headers,
        )

        assert est_res.status_code == 200
        data = est_res.json()

        assert data["project_id"] == proj_id
        assert data["is_mock"] is False
        assert data["total"]["p50"] == 2500000
        assert data["total"]["p10"] == 2250000
        assert data["total"]["p90"] == 2875000
        assert data["model"]["version"] == "1.0.0"
        assert data["model"]["data_version"] == "v1.0.0"

        # Check 9 exact categories
        breakdown = data["breakdown"]
        assert len(breakdown) == 9
        assert sum(item["amount"] for item in breakdown) == 2500000

        # Verify engine received session and EstimationInput correctly
        assert mock_engine.called
        assert mock_ml.called
        call_session, call_input = mock_engine.call_args[0]
        assert call_session is not None
        assert call_input.built_up_area_sqft == 1500.0
        assert call_input.zone_id == "ZN-PMC"
        assert call_input.quality_tier == "standard"


@pytest.mark.asyncio
async def test_create_estimate_missing_data_422(client: AsyncClient) -> None:
    headers = await _get_auth_header(client, "missing_data_tester@example.com")

    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "Missing Data Project"},
        headers=headers,
    )
    proj_id = proj_res.json()["id"]

    est_payload = {
        "built_up_area_sqft": 1000.0,
        "floors": 1,
        "bedrooms": 2,
        "bathrooms": 1,
        "zone_id": "ZN-UNKNOWN",
        "quality_tier": "economy",
        "construction_type": "rcc_framed",
    }

    with patch(
        "app.api.v1.estimates.calculate_estimate",
        new=AsyncMock(
            side_effect=MissingDataError(["zone_id:ZN-UNKNOWN", "work_item:21.01"])
        ),
    ):
        est_res = await client.post(
            f"/api/v1/projects/{proj_id}/estimates",
            json=est_payload,
            headers=headers,
        )

        assert est_res.status_code == 422
        err_data = est_res.json()
        assert "error" in err_data
        assert err_data["error"]["code"] in ("MISSING_DATA", "UNPROCESSABLE_ENTITY")
        assert "zone_id:ZN-UNKNOWN" in str(err_data["error"])


@pytest.mark.asyncio
async def test_create_estimate_nonexistent_project_404(client: AsyncClient) -> None:
    headers = await _get_auth_header(client, "not_found_tester@example.com")
    fake_proj_id = uuid.uuid4()

    est_payload = {
        "built_up_area_sqft": 1000.0,
        "floors": 1,
        "bedrooms": 2,
        "bathrooms": 1,
        "zone_id": "ZN-PMC",
        "quality_tier": "economy",
        "construction_type": "rcc_framed",
    }

    est_res = await client.post(
        f"/api/v1/projects/{fake_proj_id}/estimates",
        json=est_payload,
        headers=headers,
    )
    assert est_res.status_code == 404


@pytest.mark.asyncio
async def test_get_estimate_by_id(client: AsyncClient) -> None:
    headers = await _get_auth_header(client, "get_est_tester@example.com")

    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "Fetch Project"},
        headers=headers,
    )
    proj_id = proj_res.json()["id"]

    est_payload = {
        "built_up_area_sqft": 1200.0,
        "floors": 1,
        "bedrooms": 2,
        "bathrooms": 2,
        "zone_id": "ZN-PMC",
        "quality_tier": "standard",
        "construction_type": "rcc_framed",
    }

    mock_result = _dummy_engine_result()
    with (
        patch(
            "app.api.v1.estimates.calculate_estimate",
            new=AsyncMock(return_value=mock_result),
        ),
        patch("app.services.estimation.predict_variance", return_value=0.10),
    ):
        create_res = await client.post(
            f"/api/v1/projects/{proj_id}/estimates",
            json=est_payload,
            headers=headers,
        )
        assert create_res.status_code == 200
        est_id = create_res.json()["id"]

        get_res = await client.get(f"/api/v1/estimates/{est_id}", headers=headers)
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["id"] == est_id
        assert get_data["project_id"] == proj_id
        assert get_data["is_mock"] is False


@pytest.mark.asyncio
async def test_export_estimate_pdf_success(client: AsyncClient) -> None:
    headers = await _get_auth_header(client, "pdf_tester@example.com")

    # 1. Create project
    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "PDF Export Bungalow"},
        headers=headers,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # 2. Create estimate
    est_payload = {
        "built_up_area_sqft": 1800.0,
        "floors": 2,
        "bedrooms": 3,
        "bathrooms": 3,
        "zone_id": "ZN-PMC",
        "quality_tier": "standard",
        "construction_type": "rcc_framed",
        "plot_area_sqft": 2400.0,
        "budget_inr": 3500000,
    }

    mock_result = _dummy_engine_result()
    with (
        patch(
            "app.api.v1.estimates.calculate_estimate",
            new=AsyncMock(return_value=mock_result),
        ),
        patch("app.services.estimation.predict_variance", return_value=0.10),
    ):
        est_res = await client.post(
            f"/api/v1/projects/{proj_id}/estimates",
            json=est_payload,
            headers=headers,
        )
        assert est_res.status_code == 200
        est_id = est_res.json()["id"]

    # 3. Download PDF in English, Hindi, and Marathi via:
    # /projects/{project_id}/estimates/{estimate_id}/pdf
    for lang in ("en", "hi", "mr"):
        pdf_res = await client.get(
            f"/api/v1/projects/{proj_id}/estimates/{est_id}/pdf?lang={lang}",
            headers=headers,
        )
        assert pdf_res.status_code == 200
        assert "application/pdf" in pdf_res.headers["content-type"]
        assert f"buildsmart-estimate-{est_id}.pdf" in pdf_res.headers["content-disposition"]
        assert pdf_res.content.startswith(b"%PDF")
        assert len(pdf_res.content) > 1000

    # 4. Also verify direct route alias /estimates/{estimate_id}/pdf with lang
    for lang in ("en", "hi", "mr"):
        direct_res = await client.get(
            f"/api/v1/estimates/{est_id}/pdf?lang={lang}",
            headers=headers,
        )
        assert direct_res.status_code == 200
        assert "application/pdf" in direct_res.headers["content-type"]
        assert direct_res.content.startswith(b"%PDF")

    # 5. Invalid language parameter returns 422 Unprocessable Entity
    invalid_lang_res = await client.get(
        f"/api/v1/estimates/{est_id}/pdf?lang=invalid_lang",
        headers=headers,
    )
    assert invalid_lang_res.status_code == 422


@pytest.mark.asyncio
async def test_export_estimate_pdf_not_found(client: AsyncClient) -> None:
    headers = await _get_auth_header(client, "pdf_404_tester@example.com")
    fake_proj = uuid.uuid4()
    fake_est = uuid.uuid4()

    # Wrong project and estimate
    res = await client.get(
        f"/api/v1/projects/{fake_proj}/estimates/{fake_est}/pdf",
        headers=headers,
    )
    assert res.status_code == 404

    # Wrong direct estimate
    res_direct = await client.get(
        f"/api/v1/estimates/{fake_est}/pdf",
        headers=headers,
    )
    assert res_direct.status_code == 404


@pytest.mark.asyncio
async def test_create_estimate_ml_calibrated_variance(client: AsyncClient) -> None:
    headers = await _get_auth_header(client, "ml_calib_tester@example.com")

    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "ML Calibrated Bungalow"},
        headers=headers,
    )
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    est_payload = {
        "built_up_area_sqft": 2000.0,
        "floors": 3,
        "bedrooms": 4,
        "bathrooms": 3,
        "zone_id": "ZN-CANT",
        "quality_tier": "premium",
        "construction_type": "rcc_framed",
        "plot_area_sqft": 2500.0,
        "budget_inr": 2300000,
    }

    mock_result = _dummy_engine_result()
    with (
        patch(
            "app.api.v1.estimates.calculate_estimate",
            new=AsyncMock(return_value=mock_result),
        ),
        patch("app.services.estimation.predict_variance", return_value=0.15) as mock_ml,
    ):
        est_res = await client.post(
            f"/api/v1/projects/{proj_id}/estimates",
            json=est_payload,
            headers=headers,
        )
        assert est_res.status_code == 200
        data = est_res.json()
        assert mock_ml.called

        # Calibrated bounds:
        # P10 = 2500000 * (1 - 0.15) = 2125000
        # P90 = 2500000 * (1 + 0.15 * 1.5) = 3062500
        assert data["total"]["p50"] == 2500000
        assert data["total"]["p10"] == 2125000
        assert data["total"]["p90"] == 3062500
        assert "Secondary ML calibration applied" in data["confidence"]["reason"]
        assert data["budget"]["status"] == "tight"


