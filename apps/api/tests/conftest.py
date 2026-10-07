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
    """Create async engine for test DB (PostgreSQL in CI, SQLite fallback locally)."""
    db_url = get_test_db_url()
    try:
        engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        fallback_url = "sqlite+aiosqlite:///local_test.db"
        engine = create_async_engine(fallback_url, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    if os.path.exists("local_test.db"):
        try:
            os.remove("local_test.db")
        except OSError:
            pass


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
