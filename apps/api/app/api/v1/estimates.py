import uuid

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.estimate import EstimateCreate, EstimateResponse
from app.services import estimation
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["Estimates"])


@router.post(
    "/projects/{project_id}/estimates",
    response_model=EstimateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_estimate(
    project_id: uuid.UUID,
    req: EstimateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EstimateResponse:
    """Create a new estimate snapshot for a project using the stubbed estimation engine."""
    return await estimation.create_estimate_for_project(
        db, user_id=current_user.id, project_id=project_id, inputs=req
    )


@router.get("/estimates/{estimate_id}", response_model=EstimateResponse)
async def get_estimate(
    estimate_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EstimateResponse:
    """Get an existing estimate snapshot by ID."""
    return await estimation.get_estimate_by_id(db, user_id=current_user.id, estimate_id=estimate_id)
