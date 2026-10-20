from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="PE_",
        env_file=Path(__file__).resolve().parents[3] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PE API"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "postgresql://pe:pe_local_password@localhost:5432/pe"
    redis_url: str = "redis://localhost:6379/0"
    init_db: bool = False
    session_ttl_seconds: int = Field(default=60 * 60 * 24 * 7, ge=60)
    compose_seconds: int = Field(default=300, ge=1)
    vote_seconds: int = Field(default=300, ge=1)
    password_iterations: int = Field(default=210_000, ge=1)


@lru_cache
def get_settings() -> Settings:
    return Settings()
