from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema enforcing extra='forbid' per security requirements."""

    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        populate_by_name=True,
    )
