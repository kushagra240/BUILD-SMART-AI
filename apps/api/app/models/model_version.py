import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, UUID, Boolean, DateTime, Index, String, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class ModelVersion(Base):
    __tablename__ = "model_versions"
    __table_args__ = (
        Index(
            "uq_active_model_version",
            "is_active",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    data_version: Mapped[str] = mapped_column(String(50), nullable=False)
    metrics: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    card: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    artifact_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    trained_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
