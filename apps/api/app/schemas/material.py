import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class MaterialCharacteristicResponse(BaseSchema):
    id: uuid.UUID
    category: str
    material_name: str
    characteristic: str
    performance_focus: str
    verify_on_site_field: str
    professional_review_req: bool
    image_url: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MaterialCharacteristicListResponse(BaseSchema):
    items: list[MaterialCharacteristicResponse]
    total: int = Field(default=0, ge=0)

