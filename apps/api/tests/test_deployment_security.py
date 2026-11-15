"""Deployment-security guards: production secrets, CORS and error disclosure."""

from typing import cast

import pytest
from app.api.v1.health import health_ready
from app.core.config import DEV_DATABASE_URL, DEV_JWT_SECRET, Settings
from app.main import _cors_origins
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

PRODUCTION_JWT_SECRET = "unit-test-only-" + "a" * 40
PRODUCTION_DATABASE_URL = (
    "postgresql+asyncpg://buildsmart:strong@db.internal:5432/buildsmart"
)
PRODUCTION_ORIGIN = "https://buildsmart.vercel.app"


def _production_settings(*, allowed_origins: str = PRODUCTION_ORIGIN) -> Settings:
    return Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        JWT_SECRET=PRODUCTION_JWT_SECRET,
        DATABASE_URL=PRODUCTION_DATABASE_URL,
        ALLOWED_ORIGINS=allowed_origins,
    )


def test_production_rejects_development_defaults() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(ENVIRONMENT="production")

    message = str(exc_info.value)
    assert "JWT_SECRET" in message
    assert "DATABASE_URL" in message
    assert "ALLOWED_ORIGINS" in message


def test_production_rejects_cors_wildcard() -> None:
    with pytest.raises(ValidationError) as exc_info:
        _production_settings(allowed_origins=f"{PRODUCTION_ORIGIN},*")

    assert "must not contain '*'" in str(exc_info.value)


def test_production_rejects_plain_http_frontend_origin() -> None:
    with pytest.raises(ValidationError) as exc_info:
        _production_settings(allowed_origins="http://buildsmart.vercel.app")

    assert "https://" in str(exc_info.value)


def test_production_rejects_loopback_database_url() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            JWT_SECRET=PRODUCTION_JWT_SECRET,
            DATABASE_URL="postgresql+asyncpg://buildsmart:strong@127.0.0.1:5432/buildsmart",
            ALLOWED_ORIGINS=PRODUCTION_ORIGIN,
        )

    assert "DATABASE_URL" in str(exc_info.value)


def test_production_rejects_non_hs256_algorithm() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            JWT_SECRET=PRODUCTION_JWT_SECRET,
            DATABASE_URL=PRODUCTION_DATABASE_URL,
            ALLOWED_ORIGINS=PRODUCTION_ORIGIN,
            JWT_ALGORITHM="none",
        )

    assert "JWT_ALGORITHM" in str(exc_info.value)


def test_production_accepts_explicit_secure_config() -> None:
    settings = _production_settings()

    assert settings.JWT_SECRET != DEV_JWT_SECRET
    assert settings.DATABASE_URL != DEV_DATABASE_URL
    assert settings.DEBUG is False
    assert _cors_origins(settings.ALLOWED_ORIGINS) == [PRODUCTION_ORIGIN]


def test_cors_parser_refuses_credentialed_wildcard() -> None:
    with pytest.raises(RuntimeError, match="must not contain"):
        _cors_origins(f"{PRODUCTION_ORIGIN}, *")


@pytest.mark.asyncio
async def test_readiness_probe_does_not_echo_database_errors() -> None:
    class FailingDb:
        async def execute(self, *_args: object, **_kwargs: object) -> None:
            raise RuntimeError("password=supersecret host=db.internal")

    failing_db = cast(AsyncSession, FailingDb())

    with pytest.raises(HTTPException) as exc_info:
        await health_ready(db=failing_db)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Database connection unavailable"
    assert "supersecret" not in str(exc_info.value.detail)
