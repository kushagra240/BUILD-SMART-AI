import uuid

import pytest
from app.schemas.estimate import EstimateCreate
from app.services import estimation
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


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
        "zone_id": "pune_central",
        "quality_tier": "standard",
        "construction_type": "rcc_framed",
        "plot_area_sqft": 2000.0,
        "budget_inr": 4000000,
    }
    est_res = await client.post(
        f"/api/v1/projects/{proj_id}/estimates",
        json=est_payload,
        headers=headers,
    )
    assert est_res.status_code == 201
    est_data = est_res.json()
    assert est_data["project_id"] == proj_id
    assert est_data["is_mock"] is True

    # Verify obviously fake round placeholders
    total_p50 = est_data["total"]["p50"]
    assert total_p50 == 3000000  # 1500 sqft * 2000 INR/sqft standard tier placeholder
    assert est_data["total"]["p10"] == 2400000  # 0.80 factor
    assert est_data["total"]["p90"] == 3600000  # 1.20 factor
    assert est_data["model"]["version"] == "DEV-MOCK-v0.0"
    assert est_data["model"]["data_version"] == "DEV-SYNTHETIC-v0.0"
    assert "DEV MODEL: synthetic data, not validated" in est_data["disclaimer"]

    # Verify 9 categories sum EXACTLY to P50 total
    breakdown = est_data["breakdown"]
    assert len(breakdown) == 9
    sum_categories = sum(item["amount"] for item in breakdown)
    assert sum_categories == total_p50

    # Verify placeholder materials
    for mat in est_data["materials"]:
        assert "[MOCK STUB]" in mat["primary"]["name"]

    # Fetch estimate by ID
    est_id = est_data["id"]
    get_res = await client.get(f"/api/v1/estimates/{est_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == est_id
    assert get_res.json()["is_mock"] is True


@pytest.mark.asyncio
async def test_stub_numbers_unreachable_when_is_mock_false_endpoint(client: AsyncClient) -> None:
    """API endpoint returns 501 and refuses to serve mock stub numbers when is_mock=False."""
    headers = await get_auth_header(client, "estimator_nomock@example.com")
    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "No-Mock Project"},
        headers=headers,
    )
    proj_id = proj_res.json()["id"]

    est_payload = {
        "built_up_area_sqft": 1200.0,
        "floors": 1,
        "bedrooms": 2,
        "bathrooms": 2,
        "zone_id": "pune_central",
        "quality_tier": "standard",
        "construction_type": "rcc_framed",
    }

    # Attempting to request non-mock estimation before ML model is implemented MUST fail
    est_res = await client.post(
        f"/api/v1/projects/{proj_id}/estimates?is_mock=false",
        json=est_payload,
        headers=headers,
    )
    assert est_res.status_code == 501
    assert "unreachable when is_mock is False" in est_res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_stub_numbers_unreachable_when_is_mock_false_service(
    db_session: AsyncSession,
) -> None:
    """Service method raises RuntimeError preventing any code from reading mock stub numbers."""
    dummy_user_id = uuid.uuid4()
    dummy_project_id = uuid.uuid4()
    inputs = EstimateCreate(
        built_up_area_sqft=1000.0,
        floors=1,
        bedrooms=2,
        bathrooms=2,
        zone_id="pune_central",
        quality_tier="economy",
        construction_type="rcc_framed",
    )

    with pytest.raises(RuntimeError, match="unreachable when is_mock is False"):
        await estimation.create_estimate_for_project(
            db_session,
            user_id=dummy_user_id,
            project_id=dummy_project_id,
            inputs=inputs,
            is_mock=False,
        )

