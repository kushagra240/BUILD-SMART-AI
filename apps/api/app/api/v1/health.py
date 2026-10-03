from app.core.deps import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/live")
async def health_live() -> dict[str, str]:
    """Liveness probe confirming service process is responsive."""
    return {"status": "live", "service": "buildsmart-api"}


@router.get("/ready")
async def health_ready(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Readiness probe confirming database connection is healthy."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok", "model": "loaded_stub"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection unhealthy: {e!s}",
        ) from e
