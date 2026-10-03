from typing import Any

from app.schemas.base import BaseSchema


class ZoneOption(BaseSchema):
    id: str
    name: str


class QualityTierOption(BaseSchema):
    id: str
    name: str


class ConstructionTypeOption(BaseSchema):
    id: str
    name: str


class MetaOptionsResponse(BaseSchema):
    zones: list[ZoneOption]
    quality_tiers: list[QualityTierOption]
    construction_types: list[ConstructionTypeOption]


class MetaModelResponse(BaseSchema):
    name: str
    version: str
    data_version: str
    metrics: dict[str, Any] | None = None
    card: dict[str, Any] | None = None
    is_active: bool
