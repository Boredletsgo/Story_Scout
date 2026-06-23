"""ChromaDB client and collection management.

Connects to a Chroma server in containerized deployments, and transparently
falls back to a local persistent client when the server is unreachable (handy
for local unit tests and ``ingest`` runs).
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.rag.embeddings import get_embedding_function

logger = get_logger(__name__)

_LOCAL_CHROMA_DIR = Path(__file__).resolve().parents[2] / "data" / "chroma"


@lru_cache(maxsize=1)
def get_chroma_client() -> Any:
    """Return a cached Chroma client (HTTP server preferred, local fallback)."""
    import chromadb

    try:
        client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        client.heartbeat()
        logger.info("chroma_connected", mode="http", host=settings.CHROMA_HOST)
        return client
    except Exception as exc:  # pragma: no cover - infra dependent
        logger.warning("chroma_http_unavailable_fallback_local", error=str(exc))
        _LOCAL_CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        return chromadb.PersistentClient(path=str(_LOCAL_CHROMA_DIR))


def get_chroma_collection() -> Any:
    """Return (creating if needed) the books collection with cosine similarity."""
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION,
        embedding_function=get_embedding_function(),
        metadata={"hnsw:space": "cosine"},
    )
