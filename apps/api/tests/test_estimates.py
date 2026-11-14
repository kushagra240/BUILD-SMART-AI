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
from app.services.estimation import get_pune_material_recommendations
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


async def get_auth_header(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "StrongPassword123!", "full_name": "Estimator User"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPassword123!"},
    )
    return {"Authorization": f"Bearer {login_res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_create_and_fetch_estimate(client: AsyncClient) -> None:
    headers = await get_auth_header(client, "estimator@example.com")

    # Create project
    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "Kothrud House"},
        headers=headers,
    )
    proj_id = proj_res.json()["id"]

    # Post estimate
    est_payload = {
        "built_up_area_sqft": 1500.0,
        "floors": 2,
        "bedrooms": 3,
        "bathrooms": 3,
        "zone_id": "ZN-PMC",
        "quality_tier": "standard",
        "construction_type": "rcc_framed",
        "plot_area_sqft": 2000.0,
        "budget_inr": 4000000,
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
        assert est_res.status_code in (200, 201)
        est_data = est_res.json()
        assert est_data["project_id"] == proj_id
        assert est_data["is_mock"] is False

        total_p50 = est_data["total"]["p50"]
        assert total_p50 == 7125000
        assert est_data["total"]["p10"] == 6412500
        assert est_data["total"]["p90"] == 8193750
        assert est_data["model"]["version"] == "1.0.0"
        assert est_data["model"]["data_version"] == "v1.0.0"

        # Verify 9 categories sum EXACTLY to P50 total
        breakdown = est_data["breakdown"]
        assert len(breakdown) == 9
        sum_categories = sum(item["amount"] for item in breakdown)
        assert sum_categories == total_p50

        # Verify material recommendations returned with image_url
        materials = est_data["materials"]
        assert len(materials) >= 5
        for mat in materials:
            assert mat["category"]
            assert mat["primary"]
            assert mat["alternative"]
            assert mat["reason"]
            assert mat["image_url"] and mat["image_url"].startswith("http")

        # Fetch estimate by ID
        est_id = est_data["id"]
        get_res = await client.get(f"/api/v1/estimates/{est_id}", headers=headers)
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["id"] == est_id
        assert get_data["is_mock"] is False
        assert len(get_data["materials"]) >= 5
        assert get_data["materials"][0]["image_url"] is not None


@pytest.mark.asyncio
async def test_missing_data_returns_422(client: AsyncClient) -> None:
    """API endpoint returns 422 when calculation engine raises MissingDataError."""
    headers = await get_auth_header(client, "estimator_missing@example.com")
    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "Missing Data Project"},
        headers=headers,
    )
    proj_id = proj_res.json()["id"]

    est_payload = {
        "built_up_area_sqft": 1200.0,
        "floors": 1,
        "bedrooms": 2,
        "bathrooms": 2,
        "zone_id": "ZN-UNKNOWN",
        "quality_tier": "standard",
        "construction_type": "rcc_framed",
    }

    with patch(
        "app.api.v1.estimates.calculate_estimate",
        new=AsyncMock(side_effect=MissingDataError(["zone_id:ZN-UNKNOWN"])),
    ):
        est_res = await client.post(
            f"/api/v1/projects/{proj_id}/estimates",
            json=est_payload,
            headers=headers,
        )
        assert est_res.status_code == 422
        assert "zone_id:ZN-UNKNOWN" in str(est_res.json())


def test_pune_material_recommendations_unit() -> None:
    """Verify material recommendations generation without database dependencies."""
    recs = get_pune_material_recommendations("standard")
    assert len(recs) == 5
    categories = [r.category for r in recs]
    assert "Steel Reinforcement" in categories
    assert "Masonry Blocks" in categories
    assert "Flooring" in categories
    assert "Cement" in categories
    assert "Plumbing" in categories

    for r in recs:
        assert r.image_url and r.image_url.startswith("https://")
        assert r.primary["name"]
        assert r.alternative["name"]
        assert len(r.reason) > 20
