"""Pydantic schemas and typed records for the 'rates' repository."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field


class RatesBaseRecord(BaseModel):
    """Immutable base schema with extra='forbid'."""

    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        frozen=True,
    )


class WorkItemRecord(RatesBaseRecord):
    """Sourced completed item rate and labour component from rates.work_item_ssr."""

    work_item_id: str
    ssr_sr: int
    item_no: str
    ref_no: str | None = None
    description: str
    unit: str | None = None
    completed_rate: Decimal
    labour_rate: Decimal
    ssr_page: int
    pdf_page: int
    parse_status: str
    chapter_no: int
    chapter_name: str
    source_id: str
    basis: str

    @computed_field  # type: ignore[prop-decorator]
    @property
    def non_labour_rate(self) -> Decimal:
        """Rate component excluding labour (completed_rate - labour_rate)."""
        return self.completed_rate - self.labour_rate

    @computed_field  # type: ignore[prop-decorator]
    @property
    def labour_share(self) -> Decimal:
        """Labour proportion of completed rate rounded to 4 decimals."""
        if self.completed_rate > Decimal(0):
            return round(self.labour_rate / self.completed_rate, 4)
        return Decimal(0)


class MaterialRateRecord(RatesBaseRecord):
    """Sourced material unit rate from rates.material_rate_ssr."""

    material_id: str
    section: str
    sr: str
    material: str
    unit: str
    rate: Decimal
    ssr_page: int
    pdf_page: int
    source_id: str
    basis: str
    status: str
    unit_norm: str
    row_quality: str
    is_building_relevant: bool


class LabourRateRecord(RatesBaseRecord):
    """Resolved daily wage from rates.labour_rate_ssr and rates.minimum_wage."""

    trade: str
    daily_rate: Decimal
    unit: str = "day"
    ssr_rate: Decimal | None = None
    min_wage_rate: Decimal | None = None
    zone_id: str | None = None
    min_wage_zone: str | None = None
    skill_class: str | None = None
    source_id: str = "SRC-01"


class QuantityNormRecord(RatesBaseRecord):
    """Material consumption norm per unit of work from rates.quantity_norm."""

    norm_id: str
    category: str
    sr: int | None = None
    item: str
    item_unit: str | None = None
    material: str
    qty: Decimal | None = None
    material_unit: str | None = None
    ssr_page: int
    pdf_page: int
    parse_status: str
    source_id: str
    table_title: str | None = None


class RateRuleRecord(RatesBaseRecord):
    """Pricing adjustment rule (lift, excavation, etc.) from rates.rate_rule."""

    rule_id: str
    kind: str
    description: str
    value: Decimal | None = None
    unit: str | None = None
    reference: str | None = None
    note: str | None = None
    source_id: str
    status: str


class ZoneRecord(RatesBaseRecord):
    """Pune geographic zone definition from rates.zone."""

    zone_id: str
    name: str
    min_wage_zone: str
    basis: str | None = None
    transport_lead_km_to_main_materials: Decimal | None = None
    price_multiplier: Decimal | None = None
    source_id: str
    status: str


class DatasetVersionRecord(RatesBaseRecord):
    """Provenance and active dataset metadata from rates.dataset_version."""

    version_id: str
    label: str
    created_on: date
    price_basis: str
    notes: str | None = None
    is_active: bool
