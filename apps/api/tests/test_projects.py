import pytest
from httpx import AsyncClient


async def create_user_and_login(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "StrongPassword123!", "full_name": "Test User"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPassword123!"},
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_projects_crud_and_idor_protection(client: AsyncClient):
    headers_user_a = await create_user_and_login(client, "usera@example.com")
    headers_user_b = await create_user_and_login(client, "userb@example.com")

    # 1. User A creates a project
    create_res = await client.post(
        "/api/v1/projects",
        json={"name": "Bungalow Project A", "notes": "Main residence"},
        headers=headers_user_a,
    )
    assert create_res.status_code == 201
    proj_a = create_res.json()
    proj_id = proj_a["id"]
    assert proj_a["name"] == "Bungalow Project A"

    # 2. User A lists projects
    list_res = await client.get("/api/v1/projects", headers=headers_user_a)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1

    # 3. IDOR Protection: User B attempts to access User A's project -> MUST RETURN 404!
    idor_res = await client.get(f"/api/v1/projects/{proj_id}", headers=headers_user_b)
    assert idor_res.status_code == 404
    assert idor_res.json()["error"]["code"] == "NOT_FOUND"

    # 4. IDOR Protection: User B attempts to update User A's project -> MUST RETURN 404!
    idor_update_res = await client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Hacked Name"},
        headers=headers_user_b,
    )
    assert idor_update_res.status_code == 404

    # 5. User A updates own project
    update_res = await client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Updated Villa Project A"},
        headers=headers_user_a,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Villa Project A"

    # 6. User A soft deletes project
    del_res = await client.delete(f"/api/v1/projects/{proj_id}", headers=headers_user_a)
    assert del_res.status_code == 204

    # 7. User A attempts to view deleted project -> 404
    deleted_get_res = await client.get(f"/api/v1/projects/{proj_id}", headers=headers_user_a)
    assert deleted_get_res.status_code == 404
