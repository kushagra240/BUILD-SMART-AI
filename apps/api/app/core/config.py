from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_DATABASE_URL = "postgresql+asyncpg://buildsmart:buildsmart_dev_secret@localhost:5432/buildsmart_db"
DEV_JWT_SECRET = "dev_jwt_secret_change_in_production_min_32_bytes_long"
MIN_PRODUCTION_JWT_SECRET_LENGTH = 32

# Origins that must always work for local development.
DEV_ORIGINS = ("http://localhost:5173", "http://localhost:3000")

# The deployed frontend. Kept in code (it is public, not a secret) so a missing or
# stale platform environment variable cannot lock the browser out of the API.
PRODUCTION_ORIGINS = ("https://build-smart-ai-vert.vercel.app",)

# Preview deployments of *this* Vercel project only.
# Deliberately not "https://*.vercel.app": every Vercel customer controls their own
# subdomain, so a blanket wildcard would let any of them make credentialed requests
# to this API and read a victim's data.
DEPLOY_ORIGIN_REGEX = r"^https://build-smart-ai[a-z0-9-]*\.vercel\.app$"

# Regexes that disable the origin allow-list; refused because CORS sends credentials.
CATCH_ALL_ORIGIN_REGEXES = frozenset(
    {".*", "^.*$", "^https?://.*$", "^https?://.*", "https?://.*", "^.*", ".*$"}
)

PRODUCTION_ENVIRONMENTS = frozenset({"production", "prod"})


def parse_origins(raw: str) -> list[str]:
    """Split a comma-separated origin list, dropping blanks and trailing slashes."""
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


def resolve_cors_origins(raw: str, environment: str) -> list[str]:
    """Build the browser origin allow-list.

    In production the deployed frontend is always included and localhost/plain-HTTP
    entries from a stale platform variable are ignored, so a missing or dev-only
    ``ALLOWED_ORIGINS``/``CORS_ORIGINS`` cannot break browser authentication.
    A wildcard is always fatal: it would expose credentialed requests to any site.
    """
    origins = parse_origins(raw)
    if "*" in origins:
        raise RuntimeError(
            "ALLOWED_ORIGINS must not contain '*' because credentialed CORS is enabled"
        )
    if environment.strip().lower() in PRODUCTION_ENVIRONMENTS:
        origins = [*PRODUCTION_ORIGINS, *(o for o in origins if o.startswith("https://"))]
    return list(dict.fromkeys(origins))


def resolve_origin_regex(raw: str) -> str | None:
    """Return the preview-deployment origin regex, or None when it is disabled."""
    pattern = raw.strip()
    if not pattern:
        return None
    if pattern in CATCH_ALL_ORIGIN_REGEXES:
        raise RuntimeError(
            "ALLOWED_ORIGIN_REGEX must not match every origin because credentialed CORS is enabled"
        )
    return pattern


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    # SQLAlchemy echoes every statement and its parameters when this is true.
    # Keep it off unless a developer explicitly opts in; production rejects it.
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = DEV_DATABASE_URL

    # Security
    JWT_SECRET: str = DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "buildsmart-api"
    JWT_AUDIENCE: str = "buildsmart-web"
    ACCESS_TOKEN_TTL_MIN: int = 15
    REFRESH_TOKEN_TTL_DAYS: int = 7

    # Reverse Proxy & Security
    TRUSTED_PROXIES: str = "127.0.0.1,::1"

    # CORS. `CORS_ORIGINS` is accepted as an alias because that is what hosting
    # dashboards commonly name the variable.
    ALLOWED_ORIGINS: str = Field(
        default=",".join(DEV_ORIGINS),
        validation_alias=AliasChoices("ALLOWED_ORIGINS", "CORS_ORIGINS"),
    )
    ALLOWED_ORIGIN_REGEX: str = DEPLOY_ORIGIN_REGEX

    # ML Artifacts
    MODEL_PATH: str = "ml/artifacts/model-v1.0.0.joblib"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() in PRODUCTION_ENVIRONMENTS

    @model_validator(mode="after")
    def validate_production_config(self) -> "Settings":
        """Refuse to boot production with development defaults or an open CORS policy."""
        origins = parse_origins(self.ALLOWED_ORIGINS)
        problems: list[str] = []

        if "*" in origins:
            problems.append("ALLOWED_ORIGINS must not contain '*'")
        if self.ALLOWED_ORIGIN_REGEX.strip() in CATCH_ALL_ORIGIN_REGEXES:
            problems.append("ALLOWED_ORIGIN_REGEX must not match every origin")

        if not self.is_production:
            if problems:
                raise ValueError("Invalid configuration: " + "; ".join(problems))
            return self

        if (
            self.JWT_SECRET == DEV_JWT_SECRET
            or len(self.JWT_SECRET) < MIN_PRODUCTION_JWT_SECRET_LENGTH
        ):
            problems.append(
                "JWT_SECRET must be a unique secret of at least 32 characters "
                "(generate one with `openssl rand -hex 32`)"
            )
        if self.DATABASE_URL == DEV_DATABASE_URL or any(
            host in self.DATABASE_URL for host in ("localhost", "127.0.0.1", "::1")
        ):
            problems.append(
                "DATABASE_URL must point at the production database, not a developer default"
            )
        if self.JWT_ALGORITHM.upper() != "HS256":
            problems.append("JWT_ALGORITHM must be HS256")
        if self.DEBUG:
            problems.append("DEBUG must be false in production")

        if problems:
            raise ValueError("Invalid production configuration: " + "; ".join(problems))
        return self


settings = Settings()
