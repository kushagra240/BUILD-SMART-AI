"""SQLAlchemy Core Table definitions for PostgreSQL 'rates' schema."""

import sqlalchemy as sa

rates_metadata = sa.MetaData(schema="rates")

data_source = sa.Table(
    "data_source",
    rates_metadata,
    sa.Column("source_id", sa.Text, primary_key=True),
    sa.Column("name", sa.Text, nullable=False),
    sa.Column("issuer", sa.Text),
    sa.Column("edition_date", sa.Date),
    sa.Column("url", sa.Text),
    sa.Column("file_name", sa.Text),
    sa.Column("file_sha256", sa.String(64)),
    sa.Column("status", sa.Text, nullable=False),
    sa.Column("notes", sa.Text),
    schema="rates",
)

dataset_version = sa.Table(
    "dataset_version",
    rates_metadata,
    sa.Column("version_id", sa.Text, primary_key=True),
    sa.Column("label", sa.Text, nullable=False),
    sa.Column("created_on", sa.Date, nullable=False),
    sa.Column("price_basis", sa.Text, nullable=False),
    sa.Column("notes", sa.Text),
    sa.Column("is_active", sa.Boolean, nullable=False, default=False),
    schema="rates",
)

parameter = sa.Table(
    "parameter",
    rates_metadata,
    sa.Column("key", sa.Text, primary_key=True),
    sa.Column("value", sa.Numeric, nullable=False),
    sa.Column("description", sa.Text),
    schema="rates",
)

zone = sa.Table(
    "zone",
    rates_metadata,
    sa.Column("zone_id", sa.Text, primary_key=True),
    sa.Column("name", sa.Text, nullable=False),
    sa.Column("min_wage_zone", sa.Text, nullable=False),
    sa.Column("basis", sa.Text),
    sa.Column("transport_lead_km_to_main_materials", sa.Numeric),
    sa.Column("price_multiplier", sa.Numeric),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("status", sa.Text, nullable=False),
    schema="rates",
)

labour_rate_ssr = sa.Table(
    "labour_rate_ssr",
    rates_metadata,
    sa.Column("ssr_sr", sa.Integer, primary_key=True),
    sa.Column("trade", sa.Text, nullable=False),
    sa.Column("unit", sa.Text, nullable=False),
    sa.Column("rate_2022_23", sa.Numeric(10, 2), nullable=False),
    sa.Column("ssr_page", sa.Integer, nullable=False),
    sa.Column("pdf_page", sa.Integer, nullable=False),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("status", sa.Text, nullable=False),
    sa.Column("unit_norm", sa.Text, nullable=False),
    schema="rates",
)

minimum_wage = sa.Table(
    "minimum_wage",
    rates_metadata,
    sa.Column("wage_id", sa.Text, primary_key=True),
    sa.Column("industry", sa.Text, nullable=False),
    sa.Column("skill_class", sa.Text, nullable=False),
    sa.Column("zone", sa.Text, nullable=False),
    sa.Column("basic_monthly", sa.Integer, nullable=False),
    sa.Column("special_allowance_monthly", sa.Integer, nullable=False),
    sa.Column("total_monthly", sa.Integer, nullable=False),
    sa.Column("total_monthly_as_printed", sa.Integer),
    sa.Column("daily_rate", sa.Numeric(10, 2), nullable=False),
    sa.Column("period_start", sa.Date, nullable=False),
    sa.Column("period_end", sa.Date, nullable=False),
    sa.Column("basic_source_id", sa.Text, nullable=False),
    sa.Column("allowance_source_id", sa.Text, nullable=False),
    sa.Column("allowance_verified", sa.Boolean, nullable=False, default=False),
    sa.Column("status", sa.Text, nullable=False),
    schema="rates",
)

material_rate_ssr = sa.Table(
    "material_rate_ssr",
    rates_metadata,
    sa.Column("material_id", sa.Text, primary_key=True),
    sa.Column("section", sa.Text, nullable=False),
    sa.Column("sr", sa.Text, nullable=False),
    sa.Column("material", sa.Text, nullable=False),
    sa.Column("unit", sa.Text, nullable=False),
    sa.Column("rate", sa.Numeric(14, 2), nullable=False),
    sa.Column("ssr_page", sa.Integer, nullable=False),
    sa.Column("pdf_page", sa.Integer, nullable=False),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("basis", sa.Text, nullable=False),
    sa.Column("status", sa.Text, nullable=False),
    sa.Column("unit_norm", sa.Text, nullable=False),
    sa.Column("row_quality", sa.Text, nullable=False),
    sa.Column("is_building_relevant", sa.Boolean, nullable=False),
    schema="rates",
)

work_item_ssr = sa.Table(
    "work_item_ssr",
    rates_metadata,
    sa.Column("work_item_id", sa.Text, primary_key=True),
    sa.Column("ssr_sr", sa.Integer, nullable=False, unique=True),
    sa.Column("item_no", sa.Text, nullable=False, unique=True),
    sa.Column("ref_no", sa.Text),
    sa.Column("description", sa.Text, nullable=False),
    sa.Column("unit", sa.Text),
    sa.Column("completed_rate", sa.Numeric(14, 2), nullable=False),
    sa.Column("labour_rate", sa.Numeric(14, 2), nullable=False),
    sa.Column("ssr_page", sa.Integer, nullable=False),
    sa.Column("pdf_page", sa.Integer, nullable=False),
    sa.Column("parse_status", sa.Text, nullable=False),
    sa.Column("chapter_no", sa.Integer, nullable=False),
    sa.Column("chapter_name", sa.Text, nullable=False),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("basis", sa.Text, nullable=False),
    schema="rates",
)

quantity_norm = sa.Table(
    "quantity_norm",
    rates_metadata,
    sa.Column("norm_id", sa.Text, primary_key=True),
    sa.Column("category", sa.Text, nullable=False),
    sa.Column("sr", sa.Integer),
    sa.Column("item", sa.Text, nullable=False),
    sa.Column("item_unit", sa.Text),
    sa.Column("material", sa.Text, nullable=False),
    sa.Column("qty", sa.Numeric(12, 4)),
    sa.Column("material_unit", sa.Text),
    sa.Column("ssr_page", sa.Integer, nullable=False),
    sa.Column("pdf_page", sa.Integer, nullable=False),
    sa.Column("parse_status", sa.Text, nullable=False),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("table_title", sa.Text),
    schema="rates",
)

transport_trip_cost = sa.Table(
    "transport_trip_cost",
    rates_metadata,
    sa.Column("row_id", sa.Text, primary_key=True),
    sa.Column("mode", sa.Text, nullable=False),
    sa.Column("lead_km", sa.Numeric, nullable=False),
    sa.Column("avg_speed_kmph", sa.Numeric),
    sa.Column("factor", sa.Numeric),
    sa.Column("trips_per_day", sa.Numeric),
    sa.Column("km_done", sa.Numeric),
    sa.Column("overhead_10pct", sa.Numeric),
    sa.Column("gross_total", sa.Numeric),
    sa.Column("cost_per_trip", sa.Numeric(12, 2), nullable=False),
    sa.Column("n_numbers", sa.Integer),
    sa.Column("ssr_page", sa.Integer, nullable=False),
    sa.Column("pdf_page", sa.Integer, nullable=False),
    sa.Column("diesel_rate_per_l", sa.Numeric),
    sa.Column("labour_rate_per_day", sa.Numeric),
    sa.Column("truck_hire_per_day", sa.Numeric),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("status", sa.Text, nullable=False),
    schema="rates",
)

lead_charge_raw = sa.Table(
    "lead_charge_raw",
    rates_metadata,
    sa.Column("mode", sa.Text, primary_key=True),
    sa.Column("lead_km", sa.Numeric, primary_key=True),
    sa.Column("v01", sa.Numeric),
    sa.Column("v02", sa.Numeric),
    sa.Column("v03", sa.Numeric),
    sa.Column("v04", sa.Numeric),
    sa.Column("v05", sa.Numeric),
    sa.Column("v06", sa.Numeric),
    sa.Column("v07", sa.Numeric),
    sa.Column("v08", sa.Numeric),
    sa.Column("v09", sa.Numeric),
    sa.Column("v10", sa.Numeric),
    sa.Column("v11", sa.Numeric),
    sa.Column("v12", sa.Numeric),
    sa.Column("v13", sa.Numeric),
    sa.Column("v14", sa.Numeric),
    sa.Column("ssr_page", sa.Integer, nullable=False),
    sa.Column("pdf_page", sa.Integer, primary_key=True),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("status", sa.Text, nullable=False),
    schema="rates",
)

rate_rule = sa.Table(
    "rate_rule",
    rates_metadata,
    sa.Column("rule_id", sa.Text, primary_key=True),
    sa.Column("kind", sa.Text, nullable=False),
    sa.Column("description", sa.Text, nullable=False),
    sa.Column("value", sa.Numeric),
    sa.Column("unit", sa.Text),
    sa.Column("reference", sa.Text),
    sa.Column("note", sa.Text),
    sa.Column("source_id", sa.Text, nullable=False),
    sa.Column("status", sa.Text, nullable=False),
    schema="rates",
)

wpi_item = sa.Table(
    "wpi_item",
    rates_metadata,
    sa.Column("wpi_code", sa.Text, primary_key=True),
    sa.Column("commodity", sa.Text, nullable=False),
    sa.Column("weight", sa.Numeric),
    sa.Column("item_level", sa.Text),
    sa.Column("source_id", sa.Text, nullable=False),
    schema="rates",
)

wpi_series = sa.Table(
    "wpi_series",
    rates_metadata,
    sa.Column("wpi_code", sa.Text, primary_key=True),
    sa.Column("month", sa.Date, primary_key=True),
    sa.Column("index_value", sa.Numeric(8, 1), nullable=False),
    sa.Column("provisional", sa.Boolean, nullable=False),
    sa.Column("source_id", sa.Text, nullable=False),
    schema="rates",
)

material_wpi_map = sa.Table(
    "material_wpi_map",
    rates_metadata,
    sa.Column("material_id", sa.Text, primary_key=True),
    sa.Column("wpi_code", sa.Text, nullable=False),
    sa.Column("match_quality", sa.Text, nullable=False),
    sa.Column("rationale", sa.Text),
    sa.Column("method", sa.Text, nullable=False),
    sa.Column("reviewed", sa.Boolean, nullable=False, default=False),
    schema="rates",
)
