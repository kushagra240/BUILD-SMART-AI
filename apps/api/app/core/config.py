from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://buildsmart:buildsmart_dev_secret@localhost:5432/buildsmart_db"
    )

    # Security
    JWT_SECRET: str = "dev_jwt_secret_change_in_production_min_32_bytes_long"
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "buildsmart-api"
    JWT_AUDIENCE: str = "buildsmart-web"
    ACCESS_TOKEN_TTL_MIN: int = 15
    REFRESH_TOKEN_TTL_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ML Artifacts
    MODEL_PATH: str = "ml/artifacts/model-v1.0.0.joblib"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
