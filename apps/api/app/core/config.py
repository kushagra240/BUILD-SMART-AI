from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_DATABASE_URL = "postgresql+asyncpg://buildsmart:buildsmart_dev_secret@localhost:5432/buildsmart_db"
DEV_JWT_SECRET = "dev_jwt_secret_change_in_production_min_32_bytes_long"
MIN_PRODUCTION_JWT_SECRET_LENGTH = 32


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

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ML Artifacts
    MODEL_PATH: str = "ml/artifacts/model-v1.0.0.joblib"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_config(self) -> "Settings":
        """Refuse to boot production with development defaults or open CORS."""
        if self.ENVIRONMENT.strip().lower() not in {"production", "prod"}:
            return self

        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        problems: list[str] = []

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
        if not origins:
            problems.append("ALLOWED_ORIGINS must list the production frontend origin(s)")
        if "*" in origins:
            problems.append("ALLOWED_ORIGINS must not contain '*' in production")
        if any(not origin.startswith("https://") for origin in origins):
            problems.append("ALLOWED_ORIGINS entries must use https:// in production")

        if problems:
            raise ValueError("Invalid production configuration: " + "; ".join(problems))
        return self


settings = Settings()
