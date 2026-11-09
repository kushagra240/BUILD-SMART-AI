"""Seed script for the rates database.

Reads all 15 CSV files from data/rates/csv/ and cleanly inserts them into the
PostgreSQL 'rates' schema using SQLAlchemy async sessions.
Idempotent via ON CONFLICT DO NOTHING.
"""

import asyncio
import csv
import logging
from collections.abc import Callable
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert

from app.db.session import AsyncSessionLocal

logger = logging.getLogger("seed_rates")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BATCH_SIZE = 500


def parse_date(v: str) -> date | None:
    if not v or not v.strip():
        return None
    parts = [int(p) for p in v.strip().split("-")]
    return date(parts[0], parts[1], parts[2])


def parse_int(v: str) -> int | None:
    if not v or not v.strip():
        return None
    return int(float(v.strip()))


def parse_numeric(v: str) -> Decimal | None:
    if not v or not v.strip():
        return None
    return Decimal(v.strip())


def parse_bool(v: str) -> bool | None:
    if not v or not v.strip():
        return None
    return v.strip().lower() in ("true", "t", "1")


def parse_str(v: str) -> str | None:
    if not v or not v.strip():
        return None
    return v.strip()


# Table configurations in topological dependency order
TABLE_CONFIGS: list[dict[str, Any]] = [
    {
        "table": "data_source",
        "file": "data_source.csv",
        "columns": [
            ("source_id", sa.String, parse_str),
            ("name", sa.String, parse_str),
            ("issuer", sa.String, parse_str),
            ("edition_date", sa.Date, parse_date),
            ("url", sa.String, parse_str),
            ("file_name", sa.String, parse_str),
            ("file_sha256", sa.String, parse_str),
            ("status", sa.String, parse_str),
            ("notes", sa.String, parse_str),
        ],
    },
    {
        "table": "dataset_version",
        "file": "dataset_version.csv",
        "columns": [
            ("version_id", sa.String, parse_str),
            ("label", sa.String, parse_str),
            ("created_on", sa.Date, parse_date),
            ("price_basis", sa.String, parse_str),
            ("notes", sa.String, parse_str),
            ("is_active", sa.Boolean, parse_bool),
        ],
    },
    {
        "table": "parameter",
        "file": "parameter.csv",
        "columns": [
            ("key", sa.String, parse_str),
            ("value", sa.Numeric, parse_numeric),
            ("description", sa.String, parse_str),
        ],
    },
    {
        "table": "zone",
        "file": "zone.csv",
        "columns": [
            ("zone_id", sa.String, parse_str),
            ("name", sa.String, parse_str),
            ("min_wage_zone", sa.String, parse_str),
            ("basis", sa.String, parse_str),
            ("transport_lead_km_to_main_materials", sa.Numeric, parse_numeric),
            ("price_multiplier", sa.Numeric, parse_numeric),
            ("source_id", sa.String, parse_str),
            ("status", sa.String, parse_str),
        ],
    },
    {
        "table": "labour_rate_ssr",
        "file": "labour_rate_ssr.csv",
        "columns": [
            ("ssr_sr", sa.Integer, parse_int),
            ("trade", sa.String, parse_str),
            ("unit", sa.String, parse_str),
            ("rate_2022_23", sa.Numeric, parse_numeric),
            ("ssr_page", sa.Integer, parse_int),
            ("pdf_page", sa.Integer, parse_int),
            ("source_id", sa.String, parse_str),
            ("status", sa.String, parse_str),
            ("unit_norm", sa.String, parse_str),
        ],
    },
    {
        "table": "minimum_wage",
        "file": "minimum_wage.csv",
        "columns": [
            ("wage_id", sa.String, parse_str),
            ("industry", sa.String, parse_str),
            ("skill_class", sa.String, parse_str),
            ("zone", sa.String, parse_str),
            ("basic_monthly", sa.Integer, parse_int),
            ("special_allowance_monthly", sa.Integer, parse_int),
            ("total_monthly", sa.Integer, parse_int),
            ("total_monthly_as_printed", sa.Integer, parse_int),
            ("daily_rate", sa.Numeric, parse_numeric),
            ("period_start", sa.Date, parse_date),
            ("period_end", sa.Date, parse_date),
            ("basic_source_id", sa.String, parse_str),
            ("allowance_source_id", sa.String, parse_str),
            ("allowance_verified", sa.Boolean, parse_bool),
            ("status", sa.String, parse_str),
        ],
    },
    {
        "table": "material_rate_ssr",
        "file": "material_rate_ssr.csv",
        "columns": [
            ("material_id", sa.String, parse_str),
            ("section", sa.String, parse_str),
            ("sr", sa.String, parse_str),
            ("material", sa.String, parse_str),
            ("unit", sa.String, parse_str),
            ("rate", sa.Numeric, parse_numeric),
            ("ssr_page", sa.Integer, parse_int),
            ("pdf_page", sa.Integer, parse_int),
            ("source_id", sa.String, parse_str),
            ("basis", sa.String, parse_str),
            ("status", sa.String, parse_str),
            ("unit_norm", sa.String, parse_str),
            ("row_quality", sa.String, parse_str),
            ("is_building_relevant", sa.Boolean, parse_bool),
        ],
    },
    {
        "table": "work_item_ssr",
        "file": "work_item_ssr.csv",
        "columns": [
            ("work_item_id", sa.String, parse_str),
            ("ssr_sr", sa.Integer, parse_int),
            ("item_no", sa.String, parse_str),
            ("ref_no", sa.String, parse_str),
            ("description", sa.String, parse_str),
            ("unit", sa.String, parse_str),
            ("completed_rate", sa.Numeric, parse_numeric),
            ("labour_rate", sa.Numeric, parse_numeric),
            ("ssr_page", sa.Integer, parse_int),
            ("pdf_page", sa.Integer, parse_int),
            ("parse_status", sa.String, parse_str),
            ("chapter_no", sa.Integer, parse_int),
            ("chapter_name", sa.String, parse_str),
            ("source_id", sa.String, parse_str),
            ("basis", sa.String, parse_str),
        ],
    },
    {
        "table": "quantity_norm",
        "file": "quantity_norm.csv",
        "columns": [
            ("norm_id", sa.String, parse_str),
            ("category", sa.String, parse_str),
            ("sr", sa.Integer, parse_int),
            ("item", sa.String, parse_str),
            ("item_unit", sa.String, parse_str),
            ("material", sa.String, parse_str),
            ("qty", sa.Numeric, parse_numeric),
            ("material_unit", sa.String, parse_str),
            ("ssr_page", sa.Integer, parse_int),
            ("pdf_page", sa.Integer, parse_int),
            ("parse_status", sa.String, parse_str),
            ("source_id", sa.String, parse_str),
            ("table_title", sa.String, parse_str),
        ],
    },
    {
        "table": "transport_trip_cost",
        "file": "transport_trip_cost.csv",
        "columns": [
            ("row_id", sa.String, parse_str),
            ("mode", sa.String, parse_str),
            ("lead_km", sa.Numeric, parse_numeric),
            ("avg_speed_kmph", sa.Numeric, parse_numeric),
            ("factor", sa.Numeric, parse_numeric),
            ("trips_per_day", sa.Numeric, parse_numeric),
            ("km_done", sa.Numeric, parse_numeric),
            ("overhead_10pct", sa.Numeric, parse_numeric),
            ("gross_total", sa.Numeric, parse_numeric),
            ("cost_per_trip", sa.Numeric, parse_numeric),
            ("n_numbers", sa.Integer, parse_int),
            ("ssr_page", sa.Integer, parse_int),
            ("pdf_page", sa.Integer, parse_int),
            ("diesel_rate_per_l", sa.Numeric, parse_numeric),
            ("labour_rate_per_day", sa.Numeric, parse_numeric),
            ("truck_hire_per_day", sa.Numeric, parse_numeric),
            ("source_id", sa.String, parse_str),
            ("status", sa.String, parse_str),
        ],
    },
    {
        "table": "lead_charge_raw",
        "file": "lead_charge_raw.csv",
        "columns": [
            ("mode", sa.String, parse_str),
            ("lead_km", sa.Numeric, parse_numeric),
            *[
                (f"v{i:02d}", sa.Numeric, parse_numeric)
                for i in range(1, 15)
            ],
            ("ssr_page", sa.Integer, parse_int),
            ("pdf_page", sa.Integer, parse_int),
            ("source_id", sa.String, parse_str),
            ("status", sa.String, parse_str),
        ],
    },
    {
        "table": "rate_rule",
        "file": "rate_rule.csv",
        "columns": [
            ("rule_id", sa.String, parse_str),
            ("kind", sa.String, parse_str),
            ("description", sa.String, parse_str),
            ("value", sa.Numeric, parse_numeric),
            ("unit", sa.String, parse_str),
            ("reference", sa.String, parse_str),
            ("note", sa.String, parse_str),
            ("source_id", sa.String, parse_str),
            ("status", sa.String, parse_str),
        ],
    },
    {
        "table": "wpi_item",
        "file": "wpi_item.csv",
        "columns": [
            ("wpi_code", sa.String, parse_str),
            ("commodity", sa.String, parse_str),
            ("weight", sa.Numeric, parse_numeric),
            ("item_level", sa.String, parse_str),
            ("source_id", sa.String, parse_str),
        ],
    },
    {
        "table": "wpi_series",
        "file": "wpi_series.csv",
        "columns": [
            ("wpi_code", sa.String, parse_str),
            ("month", sa.Date, parse_date),
            ("index_value", sa.Numeric, parse_numeric),
            ("provisional", sa.Boolean, parse_bool),
            ("source_id", sa.String, parse_str),
        ],
    },
    {
        "table": "material_wpi_map",
        "file": "material_wpi_map.csv",
        "columns": [
            ("material_id", sa.String, parse_str),
            ("wpi_code", sa.String, parse_str),
            ("match_quality", sa.String, parse_str),
            ("rationale", sa.String, parse_str),
            ("method", sa.String, parse_str),
            ("reviewed", sa.Boolean, parse_bool),
        ],
    },
]


def _get_csv_dir() -> Path:
    candidates = [
        Path("data/rates/csv"),
        Path(__file__).resolve().parents[3] / "data" / "rates" / "csv",
        Path("../../data/rates/csv"),
    ]
    for p in candidates:
        if p.is_dir():
            return p
    raise FileNotFoundError("Could not locate data/rates/csv directory")


def _read_csv_records(
    csv_path: Path,
    columns_info: list[tuple[str, Any, Callable[[str], Any]]],
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            record: dict[str, Any] = {}
            for col_name, _, parser in columns_info:
                val = row.get(col_name)
                record[col_name] = parser(val) if val is not None else None
            records.append(record)
    return records


async def seed_rates(csv_dir: Path | None = None) -> dict[str, int]:
    """Seed all 15 rates CSVs into the PostgreSQL rates schema."""
    target_dir = csv_dir or _get_csv_dir()
    logger.info("Seeding rates from directory: %s", target_dir)

    inserted_counts: dict[str, int] = {}

    async with AsyncSessionLocal() as session:
        async with session.begin():
            for cfg in TABLE_CONFIGS:
                table_name = cfg["table"]
                file_name = cfg["file"]
                cols_info = cfg["columns"]

                csv_file = target_dir / file_name
                if not csv_file.is_file():
                    raise FileNotFoundError(f"Missing CSV file: {csv_file}")

                records = _read_csv_records(csv_file, cols_info)
                sa_cols = [sa.column(col_name, col_type) for col_name, col_type, _ in cols_info]
                table_clause = sa.table(table_name, *sa_cols, schema="rates")

                for i in range(0, len(records), BATCH_SIZE):
                    chunk = records[i : i + BATCH_SIZE]
                    stmt = insert(table_clause).values(chunk).on_conflict_do_nothing()
                    await session.execute(stmt)

                inserted_counts[table_name] = len(records)
                logger.info("Processed %5d rows for rates.%s", len(records), table_name)

    logger.info("Rates database seeding completed successfully.")
    return inserted_counts


def main() -> None:
    asyncio.run(seed_rates())


if __name__ == "__main__":
    main()
