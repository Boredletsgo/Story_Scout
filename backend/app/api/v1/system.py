"""System router: health, readiness, and provider info."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.llm.provider import get_provider_info
from app.rag.retriever import get_retriever

router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.PROJECT_NAME, "environment": settings.ENVIRONMENT}


@router.get("/info")
async def info() -> dict:
    provider = get_provider_info()
    try:
        indexed = get_retriever().count()
    except Exception:  # pragma: no cover
        indexed = 0
    return {
        "project": settings.PROJECT_NAME,
        "llm_provider": provider.provider,
        "llm_model": provider.model,
        "llm_requires_key": provider.requires_key,
        "llm_key_present": provider.key_present,
        "embedding_model": settings.EMBEDDING_MODEL,
        "indexed_books": indexed,
        "mlflow_enabled": settings.ENABLE_MLFLOW,
    }
