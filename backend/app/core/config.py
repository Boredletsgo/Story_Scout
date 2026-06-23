"""Application configuration via pydantic-settings.

All runtime configuration is sourced from environment variables (see
``.env.example``). Settings are cached so the object is built once per process.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LLMProvider = Literal["ollama", "openai", "anthropic"]


class Settings(BaseSettings):
    """Strongly-typed application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- General ----
    ENVIRONMENT: Literal["development", "staging", "production", "test"] = "development"
    LOG_LEVEL: str = "INFO"
    PROJECT_NAME: str = "Story Scout"
    API_V1_PREFIX: str = "/api/v1"

    # ---- Security ----
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # ---- CORS ----
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"]
    )

    # ---- Database ----
    POSTGRES_USER: str = "storyscout"
    POSTGRES_PASSWORD: str = "storyscout"
    POSTGRES_DB: str = "storyscout"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str | None = None

    # ---- ChromaDB ----
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION: str = "storyscout_books"

    # ---- Embeddings ----
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # ---- LLM provider abstraction ----
    LLM_PROVIDER: LLMProvider = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-latest"
    LLM_TEMPERATURE: float = 0.4
    LLM_MAX_TOKENS: int = 1024

    # ---- MLflow ----
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MLFLOW_EXPERIMENT_NAME: str = "storyscout-recommendations"
    ENABLE_MLFLOW: bool = True

    # ------------------------------------------------------------------ #
    # Validators
    # ------------------------------------------------------------------ #
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, v: object) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # JSON-style list string
            import json

            return list(json.loads(v))
        raise ValueError(v)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_database_uri(self) -> str:
        """Async SQLAlchemy connection string."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_HOST,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sync_database_uri(self) -> str:
        """Sync connection string (used by Alembic / management scripts)."""
        return self.sqlalchemy_database_uri.replace("+asyncpg", "+psycopg2")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


settings = get_settings()
