import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MaterialCharacteristic(Base):
    __tablename__ = "material_characteristics"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category: Mapped[str] = mapped_column(sa.String(100), nullable=False, index=True)
    material_name: Mapped[str] = mapped_column(sa.String(255), nullable=False, unique=True)
    characteristic: Mapped[str] = mapped_column(sa.Text, nullable=False)
    performance_focus: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    verify_on_site_field: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    professional_review_req: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, default=True
    )
    image_url: Mapped[str] = mapped_column(sa.String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
    )
