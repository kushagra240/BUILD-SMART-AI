import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import UUID, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.estimate import Estimate
    from app.models.user import User


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (Index("idx_projects_user_created", "user_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="projects")
    estimates: Mapped[list["Estimate"]] = relationship(
        "Estimate", back_populates="project", cascade="all, delete-orphan"
    )

    @property
    def latest_estimate(self) -> dict[str, Any] | None:
        if self.estimates:
            sorted_ests = sorted(self.estimates, key=lambda e: e.created_at, reverse=True)
            newest = sorted_ests[0]
            area = (
                newest.inputs.get("built_up_area_sqft")
                if isinstance(newest.inputs, dict)
                else None
            )
            return {
                "id": newest.id,
                "total_p50": newest.total_p50,
                "built_up_area_sqft": area,
                "created_at": newest.created_at,
            }
        return None
