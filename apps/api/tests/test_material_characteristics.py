import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_material_characteristics_meta(client: AsyncClient) -> None:
    res = await client.get("/api/v1/meta/material-characteristics")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 6

    # Verify fields for each item
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
    client: AsyncClient,
) -> None:
    res = await client.get(
        "/api/v1/meta/material-characteristics?category=Masonry%20Blocks"
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    for item in data:
        assert item["category"] == "Masonry Blocks"
