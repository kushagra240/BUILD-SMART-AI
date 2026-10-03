import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_live(client: AsyncClient) -> None:
    res = await client.get("/health/live")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "live"


@pytest.mark.asyncio
async def test_health_ready(client: AsyncClient) -> None:
    res = await client.get("/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"] == "ok"
