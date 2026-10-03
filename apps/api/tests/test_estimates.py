import pytest
from httpx import AsyncClient


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

    # Verify 9 categories sum EXACTLY to P50 total
    total_p50 = est_data["total"]["p50"]
    breakdown = est_data["breakdown"]
    assert len(breakdown) == 9
    sum_categories = sum(item["amount"] for item in breakdown)
    assert sum_categories == total_p50

    # Fetch estimate by ID
    est_id = est_data["id"]
    get_res = await client.get(f"/api/v1/estimates/{est_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == est_id
    assert get_res.json()["is_mock"] is True
