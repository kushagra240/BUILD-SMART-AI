"""Train a scikit-learn RandomForestRegressor model for cost variance calibration.

Loads synthetic project estimates generated from the T12 bottom-up engine,
trains a RandomForestRegressor on [built_up_area, floors, quality_tier_encoded, zone_id_encoded]
to predict expected variance percentage (contingency), evaluates metrics, and exports
the trained model as 'ml_model.pkl'.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS: list[str] = [
    "built_up_area",
    "floors",
    "quality_tier_encoded",
    "zone_id_encoded",
]
TARGET_COLUMN: str = "variance_pct"
DEFAULT_DATA_PATH = Path(__file__).resolve().parent / "synthetic_estimates.csv"
DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "ml_model.pkl"
DEFAULT_META_PATH = Path(__file__).resolve().parent / "model_meta.json"


def train_calibration_model(
    data_path: Path | str = DEFAULT_DATA_PATH,
    model_path: Path | str = DEFAULT_MODEL_PATH,
    meta_path: Path | str = DEFAULT_META_PATH,
    hyperparameters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Train RandomForestRegressor on synthetic dataset and save artifact."""
    params = hyperparameters or {}
    n_estimators = int(params.get("n_estimators", 100))
    max_depth = int(params.get("max_depth", 10))
    random_state = int(params.get("random_state", 42))

    data_file = Path(data_path).resolve()
    if not data_file.exists():
        raise FileNotFoundError(
            f"Synthetic training data not found at {data_file}. "
            "Run 'python apps/api/scripts/generate_synthetic_data.py' first."
        )

    df = pd.read_csv(data_file)
    for col in FEATURE_COLUMNS + [TARGET_COLUMN]:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' missing from {data_file}")

    x = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=random_state
    )

    model = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=4,
        random_state=random_state,
    )
    model.fit(x_train, y_train)

    y_pred = model.predict(x_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))

    metrics = {
        "mae": round(mae, 6),
        "rmse": round(rmse, 6),
        "r2_score": round(r2, 6),
        "samples_total": len(df),
        "samples_train": len(x_train),
        "samples_test": len(x_test),
    }

    # Save trained model artifact
    target_model_path = Path(model_path).resolve()
    target_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, target_model_path)

    # Save model metadata for provenance and traceability
    metadata = {
        "model_type": "RandomForestRegressor",
        "version": "1.0.0",
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "hyperparameters": {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "random_state": random_state,
        },
        "metrics": metrics,
    }

    target_meta_path = Path(meta_path).resolve()
    with open(target_meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return {
        "model": model,
        "metrics": metrics,
        "model_path": str(target_model_path),
        "meta_path": str(target_meta_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train ML calibration model for cost variance.")
    parser.add_argument(
        "--data",
        type=str,
        default=str(DEFAULT_DATA_PATH),
        help="Path to synthetic CSV dataset",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_MODEL_PATH),
        help="Path to save ml_model.pkl",
    )
    parser.add_argument(
        "--meta",
        type=str,
        default=str(DEFAULT_META_PATH),
        help="Path to save model_meta.json",
    )
    args = parser.parse_args()

    print(f"Training calibration model using data from {args.data}...")
    result = train_calibration_model(
        data_path=args.data,
        model_path=args.output,
        meta_path=args.meta,
    )
    print(f"Model saved successfully to {result['model_path']}")
    print(f"Evaluation Metrics: {result['metrics']}")


if __name__ == "__main__":
    main()
