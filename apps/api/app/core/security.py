import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from app.core.config import settings
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash password using Argon2id algorithm."""
    return ph.hash(password)


def verify_password(hash_str: str, password: str) -> bool:
    """Verify password against Argon2id hash in constant time."""
    try:
        return ph.verify(hash_str, password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False


def hash_token(raw_token: str) -> str:
    """Compute SHA-256 hash of an opaque token string."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_opaque_token() -> str:
    """Generate a cryptographically secure opaque token string."""
    return secrets.token_urlsafe(48)


def create_access_token(user_id: uuid.UUID, role: str = "user") -> str:
    """Create a short-lived 15-minute access JWT."""
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=settings.ACCESS_TOKEN_TTL_MIN)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and strictly validate access JWT."""
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        issuer=settings.JWT_ISSUER,
        audience=settings.JWT_AUDIENCE,
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_iat": True,
            "verify_iss": True,
            "verify_aud": True,
            "require": ["sub", "exp", "iat", "iss", "aud"],
        },
    )
