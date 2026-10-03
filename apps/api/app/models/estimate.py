import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.model_version import ModelVersion
    from app.models.project import Project


class Estimate(Base):
    __tablename__ = "estimates"
    __table_args__ = (
        Index("idx_estimates_project_created", "project_id", "created_at"),
        CheckConstraint("total_p50 > 0", name="check_total_p50_positive"),
        CheckConstraint("total_p10 >= 0", name="check_total_p10_non_negative"),
        CheckConstraint("total_p90 >= total_p50", name="check_total_p90_gte_p50"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("model_versions.id", ondelete="SET NULL"), nullable=True
    )

    inputs: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    total_p50: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_p10: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_p90: Mapped[int] = mapped_column(BigInteger, nullable=False)
    confidence_label: Mapped[str] = mapped_column(String(50), nullable=False)
    breakdown: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    materials: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    drivers: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    budget_inr: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    budget_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship("Project", back_populates="estimates")
    model_version: Mapped["ModelVersion | None"] = relationship("ModelVersion")
