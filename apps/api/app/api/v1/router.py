from app.api.v1 import auth, estimates, meta, projects
from fastapi import APIRouter

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth.router)
api_v1_router.include_router(projects.router)
api_v1_router.include_router(estimates.router)
api_v1_router.include_router(meta.router)
