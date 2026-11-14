import asyncio

import pytest
from app.core.errors import _sanitize_error_detail, setup_error_handlers
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel, field_validator


@pytest.mark.asyncio
async def test_extra_payload_fields_forbidden(client: AsyncClient) -> None:
    payload = {
        "email": "extrafield@example.com",
        "password": "StrongPassword123!",
        "full_name": "Extra Field User",
        "unauthorized_field": "hacker_data",
    }
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422
    err_data = res.json()
    assert err_data["error"]["code"] == "VALIDATION_ERROR"
    assert "request_id" in err_data["error"]


@pytest.mark.asyncio
async def test_request_id_header_propagation(client: AsyncClient) -> None:
    custom_req_id = "test-uuid-1234-5678"
    headers = {"X-Request-ID": custom_req_id}
    res = await client.get("/health/live", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("X-Request-ID") == custom_req_id


@pytest.mark.asyncio
async def test_weak_password_validation_error_serialized(client: AsyncClient) -> None:
    """Ensure ValueError raised in custom validator is serialized cleanly in 422 JSON response."""
    payload = {
        "email": "weakpass@example.com",
        "password": "password123",
        "full_name": "Weak Pass User",
    }
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422
    err_data = res.json()
    assert err_data["error"]["code"] == "VALIDATION_ERROR"
    assert err_data["error"]["message"] == "Request payload validation failed"
    details = err_data["error"]["details"]
    assert len(details) > 0
    password_error = next(d for d in details if "password" in d.get("loc", []))
    assert "ctx" in password_error
    assert isinstance(password_error["ctx"]["error"], str)
    assert "Password is too common" in password_error["ctx"]["error"]


@pytest.mark.asyncio
async def test_short_password_validation_error_serialized(client: AsyncClient) -> None:
    """Ensure short password validation error is serialized cleanly in 422 JSON response."""
    payload = {
        "email": "shortpass@example.com",
        "password": "short",
        "full_name": "Short Pass User",
    }
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422
    err_data = res.json()
    assert err_data["error"]["code"] == "VALIDATION_ERROR"
    details = err_data["error"]["details"]
    assert len(details) > 0


def test_sanitize_error_detail_unit() -> None:
    """Verify _sanitize_error_detail recursively handles Exception objects in ctx."""
    raw = [
        {
            "type": "value_error",
            "loc": ("body", "password"),
            "msg": "Value error, Password is too common",
            "ctx": {"error": ValueError("Password is too common")},
        }
    ]
    sanitized = _sanitize_error_detail(raw)
    assert sanitized[0]["ctx"]["error"] == "Password is too common"
    assert isinstance(sanitized[0]["ctx"]["error"], str)


def test_weak_password_validation_error_handler_unit() -> None:
    """Verify that a ValueError in a validator returns 422 JSON instead of a 500 error."""
    class DummyPayload(BaseModel):
        email: str
        password: str

        @field_validator("password")
        @classmethod
        def check_password(cls, v: str) -> str:
            if v == "password123":
                raise ValueError("Password is too common; please choose a stronger passphrase")
            return v

    test_app = FastAPI()
    setup_error_handlers(test_app)

    @test_app.post("/register")
    async def dummy_register(body: DummyPayload) -> dict[str, str]:
        return {"status": "ok"}

    async def _run() -> None:
        async with AsyncClient(
            transport=ASGITransport(app=test_app), base_url="http://test"
        ) as ac:
            res = await ac.post(
                "/register",
                json={
                    "email": "weak@test.local",
                    "password": "password123",
                },
            )
            assert res.status_code == 422
            data = res.json()
            assert data["error"]["code"] == "VALIDATION_ERROR"
            assert data["error"]["message"] == "Request payload validation failed"
            details = data["error"]["details"]
            assert len(details) > 0
            pwd_err = next(d for d in details if "password" in d.get("loc", []))
            assert isinstance(pwd_err["ctx"]["error"], str)
            assert "Password is too common" in pwd_err["ctx"]["error"]

    asyncio.run(_run())
