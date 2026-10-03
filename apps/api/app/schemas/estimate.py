import uuid
from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.base import BaseSchema


class EstimateCreate(BaseSchema):
    built_up_area_sqft: float = Field(
        ..., gt=0, le=100000, description="Total built-up area in sqft"
    )
    floors: int = Field(..., ge=1, le=10, description="Number of floors")
    bedrooms: int = Field(..., ge=1, le=20, description="Number of bedrooms")
    bathrooms: int = Field(..., ge=1, le=20, description="Number of bathrooms")
    zone_id: str = Field(..., min_length=2, max_length=50, description="Location zone identifier")
    quality_tier: Literal["economy", "standard", "premium"] = Field(..., description="Quality tier")
    construction_type: Literal["rcc_framed", "load_bearing"] = Field(
        ..., description="Construction type"
    )
    plot_area_sqft: float | None = Field(
        default=None, gt=0, le=200000, description="Optional plot area"
    )
    budget_inr: int | None = Field(default=None, gt=0, description="Optional target budget in INR")


class TotalEstimate(BaseSchema):
    p50: int
    p10: int
    p90: int
    currency: str = "INR"


class ConfidenceEstimate(BaseSchema):
    label: Literal["High", "Medium", "Low"]
    reason: str


class BreakdownCategoryItem(BaseSchema):
    category: str
    amount: int
    share_pct: float


class MaterialRecommendationItem(BaseSchema):
    category: str
    primary: dict[str, str | float | int]
    alternative: dict[str, str | float | int]
    reason: str


class BudgetAssessment(BaseSchema):
    status: Literal["within", "tight", "below_minimum", "not_provided"]
    gap_inr: int = 0


class CostDriverItem(BaseSchema):
    label: str
    impact_pct: float


class ModelMetaItem(BaseSchema):
    version: str
    data_version: str


class EstimateResponse(BaseSchema):
    id: uuid.UUID
    project_id: uuid.UUID
    total: TotalEstimate
    confidence: ConfidenceEstimate
    breakdown: list[BreakdownCategoryItem]
    materials: list[MaterialRecommendationItem]
    budget: BudgetAssessment
    drivers: list[CostDriverItem]
    model: ModelMetaItem
    disclaimer: str
    inputs: EstimateCreate
    is_mock: bool = Field(
        default=True, description="Flag indicating if estimate is from stub/mock model"
    )
    created_at: datetime
