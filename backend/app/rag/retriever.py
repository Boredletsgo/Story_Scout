"""Semantic retriever over the book vector store."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from app.core.logging import get_logger
from app.rag.vector_store import get_chroma_collection

logger = get_logger(__name__)


@dataclass
class RetrievedBook:
    book_id: int
    title: str
    score: float  # similarity in [0, 1]; higher is better
    metadata: dict[str, Any]
    document: str


def book_to_document(
    *,
    title: str,
    author: str | None,
    description: str | None,
    genres: list[str],
    mood: str | None,
    pacing: str | None,
    themes: str | None,
    tropes: str | None,
) -> str:
    """Render a book into the text document that gets embedded."""
    parts = [f"Title: {title}"]
    if author:
        parts.append(f"Author: {author}")
    if genres:
        parts.append(f"Genres: {', '.join(genres)}")
    if mood:
        parts.append(f"Mood: {mood}")
    if pacing:
        parts.append(f"Pacing: {pacing}")
    if themes:
        parts.append(f"Themes: {themes}")
    if tropes:
        parts.append(f"Tropes: {tropes}")
    if description:
        parts.append(f"Summary: {description}")
    return "\n".join(parts)


class BookRetriever:
    """Thin semantic-search wrapper around the Chroma collection."""

    def __init__(self) -> None:
        self._collection = get_chroma_collection()

    def search(
        self,
        query: str,
        *,
        k: int = 12,
        where: dict[str, Any] | None = None,
    ) -> list[RetrievedBook]:
        try:
            result = self._collection.query(
                query_texts=[query],
                n_results=k,
                where=where,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:  # pragma: no cover - infra dependent
            logger.warning("retriever_query_failed", error=str(exc))
            return []

        ids = result.get("ids", [[]])[0]
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        dists = result.get("distances", [[]])[0]

        retrieved: list[RetrievedBook] = []
        for _id, doc, meta, dist in zip(ids, docs, metas, dists, strict=False):
            meta = meta or {}
            book_id = int(meta.get("book_id", _id))
            similarity = max(0.0, 1.0 - float(dist))  # cosine distance -> similarity
            retrieved.append(
                RetrievedBook(
                    book_id=book_id,
                    title=str(meta.get("title", "")),
                    score=round(similarity, 4),
                    metadata=meta,
                    document=doc or "",
                )
            )
        return retrieved

    def upsert_book(
        self, *, book_id: int, document: str, metadata: dict[str, Any]
    ) -> None:
        self._collection.upsert(
            ids=[str(book_id)],
            documents=[document],
            metadatas=[{**metadata, "book_id": book_id}],
        )

    def count(self) -> int:
        try:
            return int(self._collection.count())
        except Exception:  # pragma: no cover
            return 0


@lru_cache(maxsize=1)
def get_retriever() -> BookRetriever:
    """Return a cached retriever instance."""
    return BookRetriever()
