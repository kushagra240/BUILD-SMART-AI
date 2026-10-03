import uuid
from datetime import UTC, datetime

from app.models.project import Project
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def create_project(
    db: AsyncSession, user_id: uuid.UUID, name: str, notes: str | None = None
) -> Project:
    """Create a new project owned by user."""
    project = Project(
        user_id=user_id,
        name=name.strip(),
        notes=notes.strip() if notes else None,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def get_user_projects(
    db: AsyncSession, user_id: uuid.UUID, limit: int = 50, offset: int = 0
) -> tuple[list[Project], int]:
    """Get list of active projects for user and total count."""
    base_stmt = select(Project).where(Project.user_id == user_id, Project.deleted_at.is_(None))

    count_stmt = select(func.count()).select_from(base_stmt.subquery())
    count_res = await db.execute(count_stmt)
    total = count_res.scalar_one()

    list_stmt = base_stmt.order_by(Project.created_at.desc()).offset(offset).limit(limit)
    list_res = await db.execute(list_stmt)
    items = list(list_res.scalars().all())

    return items, total


async def get_project_by_id(db: AsyncSession, user_id: uuid.UUID, project_id: uuid.UUID) -> Project:
    """Fetch project with strict object-level authorization (returns 404 for unowned/deleted)."""
    stmt = select(Project).where(
        Project.id == project_id,
        Project.user_id == user_id,
        Project.deleted_at.is_(None),
    )
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


async def update_project(
    db: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    name: str | None = None,
    notes: str | None = None,
) -> Project:
    """Update project name/notes if owned by user."""
    project = await get_project_by_id(db, user_id, project_id)

    if name is not None:
        project.name = name.strip()
    if notes is not None:
        project.notes = notes.strip() if notes else None

    await db.commit()
    await db.refresh(project)
    return project


async def soft_delete_project(db: AsyncSession, user_id: uuid.UUID, project_id: uuid.UUID) -> None:
    """Soft delete project (sets deleted_at timestamp)."""
    project = await get_project_by_id(db, user_id, project_id)
    project.deleted_at = datetime.now(UTC)
    await db.commit()
