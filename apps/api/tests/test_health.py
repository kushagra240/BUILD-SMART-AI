from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_live() -> None:
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "live", "service": "buildsmart-api"}


def test_health_ready() -> None:
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"


def test_meta_options() -> None:
    response = client.get("/api/v1/meta/options")
    assert response.status_code == 200
    data = response.json()
    assert "zones" in data
    assert "quality_tiers" in data
    assert "construction_types" in data
