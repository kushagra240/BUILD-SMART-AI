from app.api.v1 import health
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.errors import setup_error_handlers
from app.core.middleware import RequestIDMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="BuildSmart AI API",
    description="Intelligent Construction Cost Estimation and Material Recommendation System API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Custom Middlewares
app.add_middleware(RequestIDMiddleware)

# CORS setup
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers setup
setup_error_handlers(app)

# Router includes
app.include_router(health.router)
app.include_router(api_v1_router)
