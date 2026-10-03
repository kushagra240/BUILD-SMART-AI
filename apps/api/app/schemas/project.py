import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class ProjectCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    notes: str | None = Field(default=None, max_length=2000, description="Optional notes")


class ProjectUpdate(BaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)


class ProjectResponse(BaseSchema):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseSchema):
    items: list[ProjectResponse]
    total: int
