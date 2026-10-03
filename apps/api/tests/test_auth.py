import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    payload = {
        "email": "testuser@example.com",
        "password": "StrongPassword123!",
        "full_name": "Test User",
    }
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "dupuser@example.com",
        "password": "StrongPassword123!",
        "full_name": "Duplicate User",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert res2.json()["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_login_and_me_flow(client: AsyncClient):
    reg_payload = {
        "email": "flowuser@example.com",
        "password": "StrongPassword123!",
        "full_name": "Flow User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "flowuser@example.com",
        "password": "StrongPassword123!",
    }
    res = await client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200
    token_data = res.json()
    access_token = token_data["access_token"]
    assert access_token

    # Check HttpOnly refresh cookie is set
    cookies = res.cookies
    assert "buildsmart_refresh" in cookies

    # Access /auth/me
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "flowuser@example.com"


@pytest.mark.asyncio
async def test_login_wrong_credentials(client: AsyncClient):
    reg_payload = {
        "email": "wrongpwd@example.com",
        "password": "StrongPassword123!",
        "full_name": "Wrong Password User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "wrongpwd@example.com",
        "password": "WrongPassword999!",
    }
    res = await client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 401
    assert res.json()["error"]["message"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_account_lockout_on_failed_logins(client: AsyncClient):
    reg_payload = {
        "email": "lockoutuser@example.com",
        "password": "StrongPassword123!",
        "full_name": "Lockout Test User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "lockoutuser@example.com",
        "password": "WrongPassword999!",
    }
    # Fail 5 times
    for _ in range(5):
        res = await client.post("/api/v1/auth/login", json=login_payload)
        assert res.status_code == 401

    # 6th attempt should be locked
    res_locked = await client.post("/api/v1/auth/login", json=login_payload)
    assert res_locked.status_code == 400
    assert "temporarily locked" in res_locked.json()["error"]["message"]


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_reuse_detection(client: AsyncClient):
    reg_payload = {
        "email": "rotation@example.com",
        "password": "StrongPassword123!",
        "full_name": "Rotation User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "rotation@example.com", "password": "StrongPassword123!"},
    )
    first_cookie = login_res.cookies.get("buildsmart_refresh")
    assert first_cookie

    # Refresh 1: Should succeed and return new cookie
    client.cookies.set("buildsmart_refresh", first_cookie)
    ref1_res = await client.post("/api/v1/auth/refresh")
    assert ref1_res.status_code == 200
    second_cookie = ref1_res.cookies.get("buildsmart_refresh")
    assert second_cookie and second_cookie != first_cookie

    # REUSE DETECTION: Present old (first) cookie again
    client.cookies.set("buildsmart_refresh", first_cookie)
    reuse_res = await client.post("/api/v1/auth/refresh")
    assert reuse_res.status_code == 401
    assert "reuse detected" in reuse_res.json()["error"]["message"].lower()

    # Even the second_cookie should now be revoked because family was revoked!
    client.cookies.set("buildsmart_refresh", second_cookie)
    family_res = await client.post("/api/v1/auth/refresh")
    assert family_res.status_code == 401
