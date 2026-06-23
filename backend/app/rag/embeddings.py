"""Local embedding function (sentence-transformers) for ChromaDB.

Always runs locally and free of charge, regardless of the chat LLM provider, so
RAG works fully offline.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def get_embedding_function() -> Any:
    """Return a cached Chroma-compatible SentenceTransformer embedding function."""
    from chromadb.utils import embedding_functions

    logger.info("loading_embedding_model", model=settings.EMBEDDING_MODEL)
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=settings.EMBEDDING_MODEL
    )


@lru_cache(maxsize=1)
def _get_raw_model() -> Any:
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.EMBEDDING_MODEL)


def embed_query(text: str) -> list[float]:
    """Embed a single query string (used outside Chroma, e.g. in tests)."""
    model = _get_raw_model()
    return model.encode(text, normalize_embeddings=True).tolist()
