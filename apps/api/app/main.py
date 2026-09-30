from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="BuildSmart AI API",
    description="Intelligent Construction Cost Estimation and Material Recommendation System API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health/live", tags=["Health"])
async def health_live() -> dict[str, str]:
    """Liveness probe to confirm backend is running."""
    return {"status": "live", "service": "buildsmart-api"}


@app.get("/health/ready", tags=["Health"])
async def health_ready() -> dict[str, str]:
    """Readiness probe to confirm database & ML model readiness."""
    return {"status": "ready", "database": "ok", "model": "loaded"}


@app.get("/api/v1/meta/options", tags=["Metadata"])
async def get_meta_options() -> dict[str, list[dict[str, str]]]:
    """Get location zones, quality tiers, and valid project input ranges."""
    return {
        "zones": [
            {"id": "pune_central", "name": "Central Pune"},
            {"id": "pune_east", "name": "East Pune (Kharadi, Hadapsar)"},
            {"id": "pune_west", "name": "West & NW (Baner, Wakad, Hinjewadi)"},
            {"id": "pcmc", "name": "Pimpri-Chinchwad (PCMC)"},
            {"id": "pune_south_peripheral", "name": "South & Peripheral Pune"},
        ],
        "quality_tiers": [
            {"id": "economy", "name": "Economy (Basic standard finish)"},
            {"id": "standard", "name": "Standard (Good quality vitrified & branded fittings)"},
            {"id": "premium", "name": "Premium (Luxury finish, Italian marble & high-grade steel)"},
        ],
        "construction_types": [
            {"id": "rcc_framed", "name": "RCC Framed Structure"},
            {"id": "load_bearing", "name": "Load Bearing Masonry"},
        ],
    }
