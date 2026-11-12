"""Read-only rates repository package for BuildSmart AI.

Contract C2: Read-only access to 'rates' schema.
"""

from app.rates.errors import ItemNotFoundError, MissingRateDataError, RatesError
from app.rates.repository import (
    RatesRepository,
    get_active_dataset_version,
    get_all_zones,
    get_labour_rate,
    get_material_rate,
    get_quantity_norms,
    get_rate_rule,
    get_work_item,
    get_zone,
)
from app.rates.schemas import (
    DatasetVersionRecord,
    LabourRateRecord,
    MaterialRateRecord,
    QuantityNormRecord,
    RateRuleRecord,
    WorkItemRecord,
    ZoneRecord,
)

__all__ = [
    "DatasetVersionRecord",
    "ItemNotFoundError",
    "LabourRateRecord",
    "MaterialRateRecord",
    "MissingRateDataError",
    "QuantityNormRecord",
    "RateRuleRecord",
    "RatesError",
    "RatesRepository",
    "WorkItemRecord",
    "ZoneRecord",
    "get_active_dataset_version",
    "get_all_zones",
    "get_labour_rate",
    "get_material_rate",
    "get_quantity_norms",
    "get_rate_rule",
    "get_work_item",
    "get_zone",
]
