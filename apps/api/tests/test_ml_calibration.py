"""Unit tests for the ML calibration layer and variance prediction."""

from unittest.mock import patch

from app.engine.contracts import (
    BudgetAssessment,
    CategoryBreakdown,
    ConfidenceInfo,
    CostDriver,
    EstimationInput,
    EstimationResult,
    TotalCost,
)
from app.services.estimation import (
    apply_ml_calibration,
    load_ml_model,
    predict_variance,
)


def _make_dummy_result(p50: int = 2000000, budget_inr: int | None = 2200000) -> EstimationResult:
    return EstimationResult(
        total=TotalCost(
            p50=p50,
            p10=int(p50 * 0.90),
            p90=int(p50 * 1.15),
            currency="INR",
        ),
        confidence=ConfidenceInfo(
            label="Medium",
            reason="Calculated bottom-up from Maharashtra PWD SSR 2022-23 rates.",
        ),
        breakdown=[
            CategoryBreakdown(category="Structure", amount=p50, share_pct=100.0),
        ],
        line_items=[],
        budget=BudgetAssessment(status="within", gap_inr=200000),
        drivers=[CostDriver(label="Structure", impact_pct=100.0)],
        engine_version="1.0.0",
        dataset_version="v1.0.0",
        is_mock=False,
    )


def test_load_ml_model() -> None:
    """Verifies that the trained scikit-learn model artifact loads and has predict method."""
    model = load_ml_model()
    assert model is not None, "ml_model.pkl should be loaded successfully"
    assert hasattr(model, "predict"), "Loaded model must expose a predict method"


def test_predict_variance_bounds_and_tier_ordering() -> None:
    """Verifies that predicted variance is strictly bounded and responds to project tiers."""
    econ_var = predict_variance(1200.0, 1, "economy", "ZN-PMC")
    prem_var = predict_variance(1200.0, 1, "premium", "ZN-PMC")

    assert 0.05 <= econ_var <= 0.30
    assert 0.05 <= prem_var <= 0.30
    # Premium finishes have higher contingency variance than economy
    assert prem_var >= econ_var


def test_predict_variance_fallback() -> None:
    """Fallback returns 0.10 when model loading fails."""
    with patch("app.services.estimation.load_ml_model", return_value=None):
        fallback_var = predict_variance(1500.0, 2, "standard", "ZN-PMC")
        assert fallback_var == 0.10


def test_apply_ml_calibration_bounds_and_budget() -> None:
    """Verifies that apply_ml_calibration correctly scales P10/P90 and evaluates budget."""
    base_res = _make_dummy_result(p50=2000000)
    inp = EstimationInput(
        built_up_area_sqft=1500.0,
        floors=2,
        bedrooms=3,
        bathrooms=2,
        zone_id="ZN-PMC",
        quality_tier="standard",
        construction_type="rcc_framed",
        budget_inr=2100000,
    )

    with patch("app.services.estimation.predict_variance", return_value=0.12):
        calibrated = apply_ml_calibration(base_res, inp)

        # Expected: P10 = 2,000,000 * (1 - 0.12) = 1,760,000
        # Expected: P90 = 2,000,000 * (1 + 0.12 * 1.5) = 2,360,000
        assert calibrated.total.p10 == 1760000
        assert calibrated.total.p90 == 2360000

        # Budget of 2,100,000 is >= P50 (2,000,000), so status is "within"
        assert calibrated.budget.status == "within"
        assert calibrated.budget.gap_inr == 100000
        assert "Secondary ML calibration applied" in calibrated.confidence.reason


def test_apply_ml_calibration_tight_budget() -> None:
    """Verifies tight budget evaluation when budget is between P10 and P50."""
    base_res = _make_dummy_result(p50=2000000)
    inp = EstimationInput(
        built_up_area_sqft=1500.0,
        floors=2,
        bedrooms=3,
        bathrooms=2,
        zone_id="ZN-PMC",
        quality_tier="standard",
        construction_type="rcc_framed",
        budget_inr=1900000,
    )

    with patch("app.services.estimation.predict_variance", return_value=0.10):
        calibrated = apply_ml_calibration(base_res, inp)

        # P10 is 1,800,000; budget 1,900,000 is between P10 and P50
        assert calibrated.total.p10 == 1800000
        assert calibrated.budget.status == "tight"
        assert calibrated.budget.gap_inr == 100000
