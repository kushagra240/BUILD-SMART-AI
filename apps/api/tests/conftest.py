from collections.abc import AsyncGenerator

import pytest_asyncio
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

TEST_PG_URL = settings.DATABASE_URL.replace("buildsmart_db", "buildsmart_test_db")
FALLBACK_SQLITE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    """Create async engine for test database, falling back to SQLite if PostgreSQL is offline."""
    engine = create_async_engine(TEST_PG_URL, echo=False, pool_pre_ping=True)
    is_postgres = True
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        # Postgres offline, fallback to in-memory SQLite for local test execution
        await engine.dispose()
        engine = create_async_engine(FALLBACK_SQLITE_URL, echo=False)
        is_postgres = False

    async with engine.begin() as conn:
        if is_postgres:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

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
