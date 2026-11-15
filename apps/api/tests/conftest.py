import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from app.core.config import settings
from app.core.deps import get_db
from app.core.rate_limit import PerAccountLockout, RateLimiter
from app.db.base import Base
from app.main import app
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


@pytest.fixture(autouse=True)
def reset_rate_limiters() -> None:
    """Reset in-memory rate limiters and account lockout trackers before each test."""
    RateLimiter.reset()
    PerAccountLockout.reset()


def get_test_db_url() -> str:
    env_test_url = os.getenv("TEST_DATABASE_URL")
    if env_test_url:
        return env_test_url
    if "sqlite" in settings.DATABASE_URL:
        return settings.DATABASE_URL
    return settings.DATABASE_URL.replace("buildsmart_db", "buildsmart_test_db")


@pytest_asyncio.fixture(scope="session")
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    """Create the async engine for the configured test database.

    DB-backed tests require PostgreSQL (CI runs postgres:16). There is
    deliberately no SQLite fallback: a silent engine swap made local runs look
    green while proving nothing about PostgreSQL (AGENTS.md section 9). Set
    TEST_DATABASE_URL, or DATABASE_URL pointing at a test database, to run them.
    """
    db_url = get_test_db_url()
    try:
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        async with engine.begin() as conn:
            if engine.dialect.name == "postgresql":
                # ``users.email`` uses CITEXT (see models/user.py); the Alembic
                # migration creates this extension, so test-only schema
                # creation must do the same instead of failing on a fresh DB.
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS citext"))
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    except Exception as exc:
        raise RuntimeError(
            "Test database unreachable. DB-backed tests need PostgreSQL; "
            "set TEST_DATABASE_URL or DATABASE_URL. There is no SQLite "
            f"fallback by design (engine error: {type(exc).__name__})."
        ) from exc

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean DB session per test function."""
    connection = await test_engine.connect()
    transaction = await connection.begin()
    session_factory = async_sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    session = session_factory()

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTPX AsyncClient fixture with DB dependency overridden."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()
