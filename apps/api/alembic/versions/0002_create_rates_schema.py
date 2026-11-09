"""create_rates_schema

Revision ID: 0002_create_rates_schema
Revises: 0001_initial_schema
Create Date: 2026-11-09 12:35:00.000000

"""

from collections.abc import Sequence
from pathlib import Path

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_create_rates_schema"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _split_sql_statements(sql: str) -> list[str]:
    """Split raw SQL script into executable statements respecting string literals and comments."""
    statements: list[str] = []
    current: list[str] = []
    in_quote = False

    for line in sql.splitlines(keepends=True):
        stripped = line.strip()
        if not in_quote and stripped.startswith("--"):
            continue
        for char in line:
            if char == "'":
                in_quote = not in_quote
                current.append(char)
            elif char == ";" and not in_quote:
                stmt = "".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []
            else:
                current.append(char)

    rem = "".join(current).strip()
    if rem:
        statements.append(rem)
    return statements


def _get_schema_sql_path() -> Path:
    """Find data/rates/sql/schema.sql from potential invocation directories."""
    candidates = [
        Path(__file__).resolve().parents[4] / "data" / "rates" / "sql" / "schema.sql",
        Path("data/rates/sql/schema.sql"),
        Path("../../data/rates/sql/schema.sql"),
    ]
    for p in candidates:
        if p.is_file():
            return p
    raise FileNotFoundError("Could not locate data/rates/sql/schema.sql")


def upgrade() -> None:
    schema_path = _get_schema_sql_path()
    raw_sql = schema_path.read_text(encoding="utf-8")
    statements = _split_sql_statements(raw_sql)
    for stmt in statements:
        op.execute(stmt)


def downgrade() -> None:
    # Drop views in reverse dependency order
    op.execute("DROP VIEW IF EXISTS rates.v_minimum_wage_vs_ssr CASCADE;")
    op.execute("DROP VIEW IF EXISTS rates.v_material_rate_indicative CASCADE;")
    op.execute("DROP VIEW IF EXISTS rates.v_wpi_latest CASCADE;")
    op.execute("DROP VIEW IF EXISTS rates.v_work_item CASCADE;")

    # Drop tables in reverse creation order
    tables = [
        "real_project",
        "price_quote",
        "material_wpi_map",
        "wpi_series",
        "wpi_item",
        "rate_rule",
        "lead_charge_raw",
        "transport_trip_cost",
        "quantity_norm",
        "work_item_ssr",
        "material_rate_ssr",
        "minimum_wage",
        "labour_rate_ssr",
        "zone",
        "parameter",
        "dataset_version",
        "data_source",
    ]
    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS rates.{table} CASCADE;")

    # Drop schema
    op.execute("DROP SCHEMA IF EXISTS rates CASCADE;")
