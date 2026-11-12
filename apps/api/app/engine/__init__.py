"""Estimation engine package for BuildSmart AI.

Contract C3: Implements bottom-up estimation using sourced SSR rates and engineering norms.
"""

from app.engine.calculator import calculate_estimate
from app.engine.contracts import (
    BOQLineItem,
    BudgetAssessment,
    CategoryBreakdown,
    ConfidenceInfo,
    CostDriver,
    EstimationInput,
    EstimationResult,
    MissingDataError,
    TotalCost,
)

__all__ = [
    "BOQLineItem",
    "BudgetAssessment",
    "CategoryBreakdown",
    "ConfidenceInfo",
    "CostDriver",
    "EstimationInput",
    "EstimationResult",
    "MissingDataError",
    "TotalCost",
    "calculate_estimate",
]
