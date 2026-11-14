"""material_characteristics

Revision ID: 0003_material_characteristics
Revises: 0002_create_rates_schema
Create Date: 2026-11-14 15:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0003_material_characteristics"
down_revision: str | None = "0002_create_rates_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. create material_characteristics table
    table = op.create_table(
        "material_characteristics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("material_name", sa.String(length=255), nullable=False),
        sa.Column("characteristic", sa.Text(), nullable=False),
        sa.Column("performance_focus", sa.String(length=255), nullable=False),
        sa.Column("verify_on_site_field", sa.String(length=255), nullable=False),
        sa.Column(
            "professional_review_req",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column("image_url", sa.String(length=1000), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("material_name", name="uq_material_characteristics_name"),
    )
    op.create_index(
        "ix_material_characteristics_category",
        "material_characteristics",
        ["category"],
    )

    # 2. Seed scientifically accurate standard Indian construction materials
    op.bulk_insert(
        table,
        [
            {
                "id": "11111111-2222-3333-4444-555555555501",
                "category": "Walling system",
                "material_name": "AAC Blocks (IS 2185 Part 3)",
                "characteristic": "Lightweight cellular precast concrete block (density 550-650 kg/m³) with polymer-modified thin-bed mortar jointing.",
                "performance_focus": "Thermal insulation (K-value 0.16-0.18 W/m·K) and structural dead-load reduction up to 40%.",
                "verify_on_site_field": "Dry density check, compressive strength (min 3.0-4.0 N/mm²), and 2-3mm joint thickness with notch trowel.",
                "professional_review_req": True,
                "image_url": "https://images.unsplash.com/photo-1775049525334-6a797b803823?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
            },
            {
                "id": "11111111-2222-3333-4444-555555555502",
                "category": "Structural system",
                "material_name": "Fe 500D TMT Steel (IS 1786)",
                "characteristic": "High-ductility thermo-mechanically treated ribbed rebar with min 16% elongation and 0.2% proof stress of 500 N/mm².",
                "performance_focus": "Ductile earthquake energy dissipation for Pune Seismic Zone III framing and structural crack containment.",
                "verify_on_site_field": "Manufacturer test certificate (heat/cast no.), 180° cold bend/rebend verification, and nominal mass per meter tolerance.",
                "professional_review_req": True,
                "image_url": "https://images.unsplash.com/photo-1519634093379-625390ebebc7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
            },
            {
                "id": "11111111-2222-3333-4444-555555555503",
                "category": "Floor finish",
                "material_name": "Double-Charged Vitrified Tiles (IS 15622 Group BIa)",
                "characteristic": "Ultra-low water absorption (<0.05%) sintered porcelain with 3-4mm double-layer pigmented wear surface.",
                "performance_focus": "High scratch resistance (Mohs hardness 6-7) and abrasion resistance for high-foot-traffic residential zones.",
                "verify_on_site_field": "Diagonal squareness, surface flatness/warpage check (<0.1%), and hollow-sound tapping check post-curing.",
                "professional_review_req": False,
                "image_url": "https://images.unsplash.com/photo-1691784054906-07fc6e5e17b0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
            },
            {
                "id": "11111111-2222-3333-4444-555555555504",
                "category": "Openings",
                "material_name": "uPVC Window System (IS 16560)",
                "characteristic": "Multi-chamber unplasticized polyvinyl chloride profile reinforced with 1.2-1.5mm galvanized steel inserts.",
                "performance_focus": "Acoustic attenuation (up to 35-40 dB with DGU) and weather-tight EPDM gasket sealing against monsoon winds.",
                "verify_on_site_field": "Profile wall thickness (Class B min 2.5mm), drainage weep-hole clearance, and perimeter silicone sealant integrity.",
                "professional_review_req": True,
                "image_url": "https://images.unsplash.com/photo-1601362771608-a9d7430c066d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
            },
            {
                "id": "11111111-2222-3333-4444-555555555505",
                "category": "Cementitious binder",
                "material_name": "Portland Pozzolana Cement (IS 1489 Part 1)",
                "characteristic": "Interground blend of OPC clinker with 15-35% reactive siliceous fly ash pozzolana.",
                "performance_focus": "Low heat of hydration, reduced leaching porosity, and high long-term sulfate and alkali-silica reactivity resistance.",
                "verify_on_site_field": "Manufacturing week/batch date (<90 days from dispatch), absence of hardened lumps, and standard 28-day cube strength.",
                "professional_review_req": True,
                "image_url": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
            },
            {
                "id": "11111111-2222-3333-4444-555555555506",
                "category": "Plumbing & services",
                "material_name": "CPVC SDR-11 Pressure Piping (IS 15778)",
                "characteristic": "Post-chlorinated PVC thermoplastic pressure pipe rated for hot and cold water service up to 93°C.",
                "performance_focus": "Zero scaling, corrosion immunity against hard Pune groundwater, and low thermal conductivity minimizing heat loss.",
                "verify_on_site_field": "Hydrostatic pressure testing at 10-15 bar for 60 minutes minimum before wall concealment and solvent-weld curing.",
                "professional_review_req": True,
                "image_url": "https://images.unsplash.com/photo-1542013936693-884638332954?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_material_characteristics_category",
        table_name="material_characteristics",
    )
    op.drop_table("material_characteristics")

