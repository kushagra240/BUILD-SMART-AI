"""Machine Learning Calibration Package for BuildSmart AI.

Contains model training, synthetic data utilities, and variance calibration layer.
"""

from .train_model import (
    DEFAULT_DATA_PATH,
    DEFAULT_META_PATH,
    DEFAULT_MODEL_PATH,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    train_calibration_model,
)

__all__ = [
    "DEFAULT_DATA_PATH",
    "DEFAULT_META_PATH",
    "DEFAULT_MODEL_PATH",
    "FEATURE_COLUMNS",
    "TARGET_COLUMN",
    "train_calibration_model",
]
