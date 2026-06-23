"""Ingest additional books from the OpenLibrary public API into BookMind.

Usage::

    python -m scripts.ingest_openlibrary --subject fantasy --limit 30
    python -m scripts.ingest_openlibrary --query "slow burn romance" --limit 20

This enriches the catalog and vector store with real metadata. Network access
is required; failures are logged and skipped so a partial run still succeeds.
"""

from __future__ import annotations

import argparse
import asyncio

import httpx
from sqlalchemy import select

from app.core.database import get_sessionmaker
from app.core.logging import configure_logging, get_logger
from app.models.book import Book
from app.schemas.book import BookCreate
from app.services.book_service import BookService

configure_logging()
logger = get_logger("ingest")

_SUBJECT_URL = "https://openlibrary.org/subjects/{subject}.json"
_SEARCH_URL = "https://openlibrary.org/search.json"
_COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"


async def _fetch_subject(subject: str, limit: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(_SUBJECT_URL.format(subject=subject), params={"limit": limit})
        resp.raise_for_status()
        works = resp.json().get("works", [])
    return [
        {
            "title": w.get("title", "Untitled"),
            "author_name": (w.get("authors") or [{}])[0].get("name"),
            "genres": [subject.title()],
            "description": None,
            "published_year": w.get("first_publish_year"),
            "cover_url": _COVER_URL.format(cover_id=w["cover_id"]) if w.get("cover_id") else None,
            "average_rating": 0.0,
            "ratings_count": 0,
        }
        for w in works
    ]


async def _fetch_search(query: str, limit: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            _SEARCH_URL,
            params={"q": query, "limit": limit, "fields": "title,author_name,first_publish_year,cover_i,subject"},
        )
        resp.raise_for_status()
        docs = resp.json().get("docs", [])
    return [
        {
            "title": d.get("title", "Untitled"),
            "author_name": (d.get("author_name") or [None])[0],
            "genres": (d.get("subject") or [])[:3] or ["General"],
            "description": None,
            "published_year": d.get("first_publish_year"),
            "cover_url": _COVER_URL.format(cover_id=d["cover_i"]) if d.get("cover_i") else None,
            "average_rating": 0.0,
            "ratings_count": 0,
        }
        for d in docs
    ]


async def ingest(entries: list[dict]) -> None:
    created = 0
    async with get_sessionmaker()() as session:
        service = BookService(session)
        for entry in entries:
            try:
                existing = await session.execute(
                    select(Book).where(Book.title == entry["title"])
                )
                if existing.scalar_one_or_none():
                    continue
                book = await service.create_book(BookCreate(**entry), index=False)
                await session.commit()
                await session.refresh(book, attribute_names=["author", "genres"])
                service.index_book(book)
                created += 1
            except Exception as exc:  # pragma: no cover - network dependent
                logger.warning("ingest_entry_failed", title=entry.get("title"), error=str(exc))
                await session.rollback()
    logger.info("ingest_complete", created=created, fetched=len(entries))


async def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest books from OpenLibrary.")
    parser.add_argument("--subject", help="OpenLibrary subject, e.g. fantasy")
    parser.add_argument("--query", help="Free-text search query")
    parser.add_argument("--limit", type=int, default=25)
    args = parser.parse_args()

    if args.subject:
        entries = await _fetch_subject(args.subject, args.limit)
    elif args.query:
        entries = await _fetch_search(args.query, args.limit)
    else:
        parser.error("Provide --subject or --query")
        return

    await ingest(entries)


if __name__ == "__main__":
    asyncio.run(main())
