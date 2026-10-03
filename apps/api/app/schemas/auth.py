import uuid
from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema

COMMON_WEAK_PASSWORDS = {
    "password123",
    "1234567890",
    "admin12345",
    "letmein123",
    "welcome123",
    "buildsmart",
}


MIN_PASSWORD_LENGTH = 10


def validate_password_strength(v: str) -> str:
    if len(v) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    if v.lower() in COMMON_WEAK_PASSWORDS:
        raise ValueError("Password is too common; please choose a stronger passphrase")
    return v


class RegisterRequest(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=10, description="Minimum 10 characters")
    full_name: str = Field(..., min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)


class LoginRequest(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes in seconds


class UserResponse(BaseSchema):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class UserUpdateRequest(BaseSchema):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    password: str | None = Field(default=None, min_length=10)

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str | None) -> str | None:
        if v is not None:
            return validate_password_strength(v)
        return v
