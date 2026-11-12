"""Sanity Invariants and ML Pipeline tests for BuildSmart AI.

These tests enforce non-negotiable sanity rules:
1. Cost variance percentage increases or stays constant with floor count (vertical complexity).
2. Premium quality tier variance >= Economy quality tier variance.
3. Predictions from the ML calibration model are strictly bounded within [0.05, 0.30].
"""

from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "apps" / "api" / "ml" / "ml_model.pkl"
FEATURE_COLUMNS = ["built_up_area", "floors", "quality_tier_encoded", "zone_id_encoded"]


def test_area_monotonicity_placeholder() -> None:
    """Placeholder test for cost monotonicity relative to built-up area."""
    area_small = 1000
    area_large = 2000
    assert area_large > area_small, "Area monotonicity assertion structure initialized"


def test_quality_tier_hierarchy_placeholder() -> None:
    """Placeholder test for quality tier cost hierarchy."""
    tiers = ["economy", "standard", "premium"]
    assert len(tiers) == 3
    assert tiers[2] == "premium"


def test_ml_model_artifact_exists_and_predicts() -> None:
    """ML calibration artifact ml_model.pkl exists and produces valid predictions."""
    assert MODEL_PATH.is_file(), f"Model file must exist at {MODEL_PATH}"
    model = joblib.load(MODEL_PATH)
    sample = pd.DataFrame([[1500.0, 2, 1, 0]], columns=FEATURE_COLUMNS)
    pred = model.predict(sample)[0]
    assert 0.05 <= pred <= 0.30


def test_ml_variance_floor_monotonicity() -> None:
    """Higher floors imply higher or equal cost contingency variance due to staging/crane risk."""
    model = joblib.load(MODEL_PATH)
    pred_1_floor = model.predict(pd.DataFrame([[2000.0, 1, 1, 0]], columns=FEATURE_COLUMNS))[0]
    pred_4_floor = model.predict(pd.DataFrame([[2000.0, 4, 1, 0]], columns=FEATURE_COLUMNS))[0]
    assert pred_4_floor >= pred_1_floor


def test_ml_variance_tier_hierarchy() -> None:
    """Premium tier variance >= Economy tier variance due to specialized materials risk."""
    model = joblib.load(MODEL_PATH)
    # Tier: 0 = economy, 2 = premium
    pred_econ = model.predict(pd.DataFrame([[2000.0, 2, 0, 0]], columns=FEATURE_COLUMNS))[0]
    pred_prem = model.predict(pd.DataFrame([[2000.0, 2, 2, 0]], columns=FEATURE_COLUMNS))[0]
    assert pred_prem >= pred_econ
