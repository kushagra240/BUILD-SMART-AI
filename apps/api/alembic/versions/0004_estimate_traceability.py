"""estimate traceability fields

Revision ID: 0004_estimate_traceability
Revises: 0003_material_characteristics
Create Date: 2026-11-15 00:00:00.000000

Persist the values the engine already produced so a saved estimate can be
served back without hard-coded placeholders: the budget gap, the confidence
reason, the engine/dataset versions and the disclaimer.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_estimate_traceability"
down_revision: str | None = "0003_material_characteristics"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("estimates", sa.Column("gap_inr", sa.BigInteger(), nullable=True))
    op.add_column("estimates", sa.Column("confidence_reason", sa.Text(), nullable=True))
    op.add_column("estimates", sa.Column("engine_version", sa.String(length=50), nullable=True))
    op.add_column("estimates", sa.Column("dataset_version", sa.String(length=50), nullable=True))
    op.add_column("estimates", sa.Column("disclaimer", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("estimates", "disclaimer")
    op.drop_column("estimates", "dataset_version")
    op.drop_column("estimates", "engine_version")
    op.drop_column("estimates", "confidence_reason")
    op.drop_column("estimates", "gap_inr")
