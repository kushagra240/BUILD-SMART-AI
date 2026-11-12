"""Engine contracts for bottom-up cost estimation (Contract C3).

Owned by Lane L3. L2 and L4 import from this module; nobody else edits it.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class BaseEngineModel(BaseModel):
    """Immutable base schema with extra='forbid'."""

    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        frozen=True,
    )


class EstimationInput(BaseEngineModel):
    """Input parameters for bottom-up house cost estimation."""

    built_up_area_sqft: float = Field(
        ..., gt=0, le=100000, description="Total built-up area in sqft"
    )
    floors: int = Field(..., ge=1, le=10, description="Number of floors")
    bedrooms: int = Field(..., ge=1, le=20, description="Number of bedrooms")
    bathrooms: int = Field(..., ge=1, le=20, description="Number of bathrooms")
    zone_id: str = Field(..., min_length=2, max_length=50, description="Location zone identifier")
    quality_tier: Literal["economy", "standard", "premium"] = Field(..., description="Quality tier")
    construction_type: Literal["rcc_framed", "load_bearing"] = Field(
        default="rcc_framed", description="Construction type"
    )
    plot_area_sqft: float | None = Field(
        default=None, gt=0, le=200000, description="Optional plot area"
    )
    budget_inr: int | None = Field(default=None, gt=0, description="Optional target budget in INR")


class MissingDataError(Exception):
    """Raised when an engine input, rate, or required data key is missing (TODO(data))."""

    def __init__(self, missing_keys: list[str], message: str | None = None) -> None:
        self.missing_keys = missing_keys
        msg = message or f"Missing required data or rates for: {', '.join(missing_keys)}"
        super().__init__(msg)


class CategoryBreakdown(BaseEngineModel):
    """Category breakdown item for one of the 9 exact categories."""

    category: str
    amount: int
    share_pct: float


class BOQLineItem(BaseEngineModel):
    """Itemized bill of quantities line item audit trail."""

    item_code: str
    description: str
    category: str
    quantity: float
    unit: str
    unit_rate: float
    labour_rate: float
    non_labour_rate: float
    total_cost: float
    labour_cost: float
    non_labour_cost: float
    source_id: str


class TotalCost(BaseEngineModel):
    """Estimated cost variance (P10 low, P50 median, P90 high)."""

    p50: int
    p10: int
    p90: int
    currency: str = "INR"


class ConfidenceInfo(BaseEngineModel):
    """Confidence label and documented explanation."""

    label: Literal["High", "Medium", "Low"]
    reason: str


class BudgetAssessment(BaseEngineModel):
    """Evaluation against target homeowner budget."""

    status: Literal["within", "tight", "below_minimum", "not_provided"]
    gap_inr: int = 0


class CostDriver(BaseEngineModel):
    """Top cost driver impacting overall estimate."""

    label: str
    impact_pct: float


class EstimationResult(BaseEngineModel):
    """Complete output of the bottom-up estimation engine."""

    total: TotalCost
    confidence: ConfidenceInfo
    breakdown: list[CategoryBreakdown]
    line_items: list[BOQLineItem]
    budget: BudgetAssessment
    drivers: list[CostDriver]
    engine_version: str = "1.0.0"
    dataset_version: str = "v1.0.0"
    is_mock: bool = False
    disclaimer: str = (
        "Preliminary estimate calculated bottom-up using Maharashtra PWD SSR 2022-23 rates. "
        "Excludes GST, land cost, structural design variations, and live supplier fluctuations."
    )
