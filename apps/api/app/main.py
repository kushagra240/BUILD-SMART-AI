from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import health
from app.api.v1.router import api_v1_router
from app.core.config import resolve_cors_origins, resolve_origin_regex, settings
from app.core.errors import setup_error_handlers
from app.core.middleware import RequestIDMiddleware, SecurityHeadersMiddleware

app = FastAPI(
    title="BuildSmart AI API",
    description="Intelligent Construction Cost Estimation and Material Recommendation System API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Custom Middlewares
app.add_middleware(RequestIDMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# CORS setup. The resolver always allows the deployed frontend in production, so an
# unset or stale platform variable cannot break browser authentication.
app.add_middleware(
    CORSMiddleware,
    allow_origins=resolve_cors_origins(settings.ALLOWED_ORIGINS, settings.ENVIRONMENT),
    allow_origin_regex=resolve_origin_regex(settings.ALLOWED_ORIGIN_REGEX),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Content-Disposition"],
)

# Error handlers setup
setup_error_handlers(app)

# Router includes
app.include_router(health.router)
app.include_router(api_v1_router)
