from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.model_version import ModelVersion
from app.schemas.meta import (
    ConstructionTypeOption,
    MetaModelResponse,
    MetaOptionsResponse,
    QualityTierOption,
    ZoneOption,
)

router = APIRouter(prefix="/meta", tags=["Metadata"])


@router.get("/options", response_model=MetaOptionsResponse)
async def get_meta_options() -> MetaOptionsResponse:
    """Get Pune location zones, quality tiers, and valid project input options."""
    return MetaOptionsResponse(
        zones=[
            ZoneOption(id="pune_central", name="Central Pune"),
            ZoneOption(id="pune_east", name="East Pune (Kharadi, Hadapsar)"),
            ZoneOption(id="pune_west", name="West & NW (Baner, Wakad, Hinjewadi)"),
            ZoneOption(id="pcmc", name="Pimpri-Chinchwad (PCMC)"),
            ZoneOption(id="pune_south_peripheral", name="South & Peripheral Pune"),
        ],
        quality_tiers=[
            QualityTierOption(id="economy", name="Economy (Basic standard finish)"),
            QualityTierOption(
                id="standard", name="Standard (Good quality vitrified & branded fittings)"
            ),
            QualityTierOption(
                id="premium", name="Premium (Luxury finish, Italian marble & high-grade steel)"
            ),
        ],
        construction_types=[
            ConstructionTypeOption(id="rcc_framed", name="RCC Framed Structure"),
            ConstructionTypeOption(id="load_bearing", name="Load Bearing Masonry"),
        ],
    )


@router.get("/model", response_model=MetaModelResponse)
async def get_meta_model(db: AsyncSession = Depends(get_db)) -> MetaModelResponse:
    """Get metadata for the currently active ML model version."""
    stmt = select(ModelVersion).where(ModelVersion.is_active.is_(True))
    res = await db.execute(stmt)
    active_model = res.scalar_one_or_none()

    if active_model:
        return MetaModelResponse(
            name=active_model.name,
            version=active_model.version,
            data_version=active_model.data_version,
            metrics=active_model.metrics,
            card=active_model.card,
            is_active=True,
        )

    # Default fallback when model card has not been trained yet (Phase 2 stub)
    return MetaModelResponse(
        name="BuildSmart Baseline Stub",
        version="v0.1-stub",
        data_version="pune-sor-v1-stub",
        metrics={"real_data_mape": "N/A (Stub)"},
        card={"note": "Estimation engine is currently stubbed for Phase 2"},
        is_active=False,
    )
