from collections.abc import AsyncGenerator, Generator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.core.deps import get_db
from app.main import app
from app.models.material_characteristic import MaterialCharacteristic
from app.services.material_service import (
    SCIENTIFIC_MATERIAL_DATA,
    get_all_material_characteristics,
)
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def override_db() -> Generator[None, None, None]:
    async def mock_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield AsyncMock()

    app.dependency_overrides[get_db] = mock_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def mock_material_items() -> list[MaterialCharacteristic]:
    return [
        MaterialCharacteristic(
            id=d["id"],
            category=d["category"],
            material_name=d["material_name"],
            characteristic=d["characteristic"],
            performance_focus=d["performance_focus"],
            verify_on_site_field=d["verify_on_site_field"],
            professional_review_req=d["professional_review_req"],
            image_url=d["image_url"],
        )
        for d in SCIENTIFIC_MATERIAL_DATA
    ]


@pytest.mark.asyncio
async def test_get_material_characteristics_meta(
    mock_material_items: list[MaterialCharacteristic],
) -> None:
    async def mock_get_all(
        db: Any, category: str | None = None
    ) -> list[MaterialCharacteristic]:
        if category:
            return [
                m for m in mock_material_items if m.category.lower() == category.lower()
            ]
        return mock_material_items

    with patch(
        "app.api.v1.meta.get_all_material_characteristics",
        side_effect=mock_get_all,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.get("/api/v1/meta/material-characteristics")
            assert res.status_code == 200
            data = res.json()
            assert isinstance(data, list)
            assert len(data) >= 6

            for item in data:
                assert "id" in item
                assert "category" in item
                assert "material_name" in item
                assert "characteristic" in item
                assert "performance_focus" in item
                assert "verify_on_site_field" in item
                assert "professional_review_req" in item
                assert "image_url" in item

                # Strict rules: no customer reviews, ratings, or prices
                assert "rating" not in item
                assert "stars" not in item
                assert "reviews" not in item
                assert "price" not in item
                assert "cost" not in item


@pytest.mark.asyncio
async def test_get_material_characteristics_filter_by_category(
    mock_material_items: list[MaterialCharacteristic],
) -> None:
    async def mock_get_all(
        db: Any, category: str | None = None
    ) -> list[MaterialCharacteristic]:
        if category:
            return [
                m for m in mock_material_items if m.category.lower() == category.lower()
            ]
        return mock_material_items

    with patch(
        "app.api.v1.meta.get_all_material_characteristics",
        side_effect=mock_get_all,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.get(
                "/api/v1/meta/material-characteristics?category=Walling%20system"
            )
            assert res.status_code == 200
            data = res.json()
            assert isinstance(data, list)
            assert len(data) >= 1
            for item in data:
                assert item["category"] == "Walling system"


@pytest.mark.asyncio
async def test_get_material_characteristics_nonexistent_category(
    mock_material_items: list[MaterialCharacteristic],
) -> None:
    async def mock_get_all(
        db: Any, category: str | None = None
    ) -> list[MaterialCharacteristic]:
        if category:
            return [
                m for m in mock_material_items if m.category.lower() == category.lower()
            ]
        return mock_material_items

    with patch(
        "app.api.v1.meta.get_all_material_characteristics",
        side_effect=mock_get_all,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.get(
                "/api/v1/meta/material-characteristics?category=NonExistentCategory"
            )
            assert res.status_code == 200
            data = res.json()
            assert isinstance(data, list)
            assert len(data) == 0


@pytest.mark.asyncio
async def test_service_get_all_material_characteristics_db_query(
    mock_material_items: list[MaterialCharacteristic],
) -> None:
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = mock_material_items
    mock_db.execute = AsyncMock(return_value=mock_result)

    items = await get_all_material_characteristics(mock_db)
    assert len(items) == len(mock_material_items)


@pytest.mark.asyncio
async def test_service_get_all_material_characteristics_fallback() -> None:
    # When DB encounters an error/unreachable, service falls back to scientific defaults
    mock_db = AsyncMock()
    mock_db.execute.side_effect = Exception("DB offline")
    items = await get_all_material_characteristics(mock_db)
    assert len(items) == 6

    filtered = await get_all_material_characteristics(mock_db, category="Walling system")
    assert len(filtered) == 1
    assert filtered[0].material_name == "AAC Blocks (IS 2185 Part 3)"
