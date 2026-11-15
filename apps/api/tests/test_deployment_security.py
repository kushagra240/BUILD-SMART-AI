"""Deployment guards: production secrets, CORS, cookies and error disclosure."""

import re
from typing import cast

import pytest
from app.api.v1.auth import REFRESH_COOKIE_NAME, clear_refresh_cookie, set_refresh_cookie
from app.api.v1.health import health_ready
from app.core.config import (
    DEPLOY_ORIGIN_REGEX,
    DEV_DATABASE_URL,
    DEV_JWT_SECRET,
    PRODUCTION_ORIGINS,
    Settings,
    resolve_cors_origins,
    resolve_origin_regex,
    settings,
)
from app.main import app
from fastapi import HTTPException, Response
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

PRODUCTION_JWT_SECRET = "unit-test-only-" + "a" * 40
PRODUCTION_DATABASE_URL = (
    "postgresql+asyncpg://buildsmart:strong@db.internal:5432/buildsmart"
)
DEPLOYED_FRONTEND = "https://build-smart-ai-vert.vercel.app"


def _production_settings(
    *,
    debug: bool = False,
    jwt_secret: str = PRODUCTION_JWT_SECRET,
    database_url: str = PRODUCTION_DATABASE_URL,
    allowed_origins: str = DEPLOYED_FRONTEND,
) -> Settings:
    return Settings(
        ENVIRONMENT="production",
        DEBUG=debug,
        JWT_SECRET=jwt_secret,
        DATABASE_URL=database_url,
        ALLOWED_ORIGINS=allowed_origins,
    )


def test_production_rejects_development_defaults() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(ENVIRONMENT="production")

    message = str(exc_info.value)
    assert "JWT_SECRET" in message
    assert "DATABASE_URL" in message


def test_production_rejects_loopback_database_url() -> None:
    with pytest.raises(ValidationError) as exc_info:
        _production_settings(
            database_url="postgresql+asyncpg://buildsmart:strong@127.0.0.1:5432/buildsmart"
        )

    assert "DATABASE_URL" in str(exc_info.value)


def test_production_rejects_non_hs256_algorithm() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET=PRODUCTION_JWT_SECRET,
            DATABASE_URL=PRODUCTION_DATABASE_URL,
            JWT_ALGORITHM="none",
        )

    assert "JWT_ALGORITHM" in str(exc_info.value)


def test_production_rejects_debug_mode() -> None:
    with pytest.raises(ValidationError) as exc_info:
        _production_settings(debug=True)

    assert "DEBUG" in str(exc_info.value)


def test_production_accepts_explicit_secure_config() -> None:
    settings_under_test = _production_settings()

    assert settings_under_test.JWT_SECRET != DEV_JWT_SECRET
    assert settings_under_test.DATABASE_URL != DEV_DATABASE_URL
    assert settings_under_test.DEBUG is False


def test_production_rejects_cors_wildcard() -> None:
    with pytest.raises(ValidationError) as exc_info:
        _production_settings(allowed_origins=f"{DEPLOYED_FRONTEND},*")

    assert "must not contain '*'" in str(exc_info.value)


def test_development_rejects_cors_wildcard() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(ALLOWED_ORIGINS="*")

    assert "must not contain '*'" in str(exc_info.value)


def test_production_rejects_catch_all_origin_regex() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET=PRODUCTION_JWT_SECRET,
            DATABASE_URL=PRODUCTION_DATABASE_URL,
            ALLOWED_ORIGIN_REGEX=".*",
        )

    assert "ALLOWED_ORIGIN_REGEX" in str(exc_info.value)


def test_production_cors_allows_deployed_frontend_without_env() -> None:
    """A missing or dev-only CORS variable must not lock the deployed SPA out."""
    origins = resolve_cors_origins("", "production")

    assert DEPLOYED_FRONTEND in origins
    assert origins == list(PRODUCTION_ORIGINS)


def test_production_cors_ignores_stale_localhost_entries() -> None:
    origins = resolve_cors_origins("http://localhost:5173,http://localhost:3000", "production")

    assert "http://localhost:5173" not in origins
    assert DEPLOYED_FRONTEND in origins


def test_production_cors_keeps_extra_https_origins() -> None:
    origins = resolve_cors_origins(f"{DEPLOYED_FRONTEND},https://staging.example.com", "production")

    assert origins == [DEPLOYED_FRONTEND, "https://staging.example.com"]


def test_development_cors_keeps_local_origins() -> None:
    origins = resolve_cors_origins("http://localhost:5173,http://localhost:3000", "development")

    assert origins == ["http://localhost:5173", "http://localhost:3000"]


def test_cors_parser_refuses_credentialed_wildcard() -> None:
    with pytest.raises(RuntimeError, match="must not contain"):
        resolve_cors_origins(f"{DEPLOYED_FRONTEND}, *", "production")


def test_cors_origins_alias_is_accepted(monkeypatch: pytest.MonkeyPatch) -> None:
    """Hosting dashboards commonly call the variable CORS_ORIGINS."""
    monkeypatch.setenv("CORS_ORIGINS", "https://staging.example.com")
    settings_under_test = Settings(
        ENVIRONMENT="production",
        JWT_SECRET=PRODUCTION_JWT_SECRET,
        DATABASE_URL=PRODUCTION_DATABASE_URL,
    )

    assert "https://staging.example.com" in resolve_cors_origins(
        settings_under_test.ALLOWED_ORIGINS, "production"
    )


def test_preview_regex_matches_only_this_projects_deployments() -> None:
    pattern = re.compile(resolve_origin_regex(DEPLOY_ORIGIN_REGEX) or "")

    assert pattern.match(DEPLOYED_FRONTEND)
    assert pattern.match("https://build-smart-ai-git-main-team.vercel.app")
    assert not pattern.match("https://attacker.vercel.app")
    assert not pattern.match("https://build-smart-ai.evil.example")


def test_origin_regex_can_be_disabled() -> None:
    assert resolve_origin_regex("") is None
    assert resolve_origin_regex("   ") is None


def test_cookie_is_cross_site_safe_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    response = Response()

    set_refresh_cookie(response, "opaque-token")

    header = response.headers["set-cookie"]
    assert REFRESH_COOKIE_NAME in header
    assert "HttpOnly" in header
    assert "Secure" in header
    assert "SameSite=none" in header


def test_cookie_stays_lax_for_local_http_development(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    response = Response()

    set_refresh_cookie(response, "opaque-token")

    header = response.headers["set-cookie"]
    assert "SameSite=lax" in header
    assert "Secure" not in header


def test_clearing_cookie_mirrors_its_attributes(monkeypatch: pytest.MonkeyPatch) -> None:
    """A Secure/None cookie cannot be overwritten by a non-Secure one."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    response = Response()

    clear_refresh_cookie(response)

    header = response.headers["set-cookie"]
    assert REFRESH_COOKIE_NAME in header
    assert "Secure" in header
    assert "SameSite=none" in header
    assert "Max-Age=0" in header or "expires=" in header.lower()


@pytest.mark.asyncio
async def test_preflight_allows_configured_origin_with_credentials() -> None:
    """The browser's OPTIONS preflight must succeed or POST never leaves the page."""
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.options(
            "/api/v1/auth/register",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"
    assert "POST" in response.headers["access-control-allow-methods"]


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

