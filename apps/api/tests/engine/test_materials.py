"""Unit tests for the rule-based material recommendation engine."""

import pytest
from app.engine.materials import get_material_recommendations


def test_material_recommendations_five_categories() -> None:
    recs = get_material_recommendations("standard")
    assert len(recs) == 5
    categories = [r.category for r in recs]
    assert categories == ["Cement", "Steel", "Masonry", "Flooring", "Plumbing"]

    for r in recs:
        assert "name" in r.primary
        assert "grade" in r.primary
        assert "spec" in r.primary
        assert "name" in r.alternative
        assert "grade" in r.alternative
        assert "spec" in r.alternative
        assert len(r.reason) > 10


@pytest.mark.parametrize(
    ("tier", "expected_steel_keyword"),
    [
        ("economy", "500 Standard"),
        ("standard", "500D High-Ductility"),
        ("premium", "550D"),
    ],
)
def test_material_recommendations_tier_variation(
    tier: str,
    expected_steel_keyword: str,
) -> None:
    recs = get_material_recommendations(tier)
    steel_rec = next(r for r in recs if r.category == "Steel")
    assert expected_steel_keyword in str(steel_rec.primary["name"])


def test_material_recommendations_fallback_on_invalid_tier() -> None:
    recs_invalid = get_material_recommendations("ultra_luxury_custom")
    recs_standard = get_material_recommendations("standard")

    assert [r.primary["name"] for r in recs_invalid] == [
        r.primary["name"] for r in recs_standard
    ]
