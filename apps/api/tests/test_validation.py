import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_extra_payload_fields_forbidden(client: AsyncClient):
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
async def test_request_id_header_propagation(client: AsyncClient):
    custom_req_id = "test-uuid-1234-5678"
    headers = {"X-Request-ID": custom_req_id}
    res = await client.get("/health/live", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("X-Request-ID") == custom_req_id
