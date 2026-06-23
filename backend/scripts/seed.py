"""Seed the database and vector store with curated books + a demo user.

Run inside the backend container (or locally with the venv active)::

    python -m scripts.seed

Idempotent: existing books (matched by title) and the demo user are skipped.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from sqlalchemy import select

from app.core.database import Base, get_engine, get_sessionmaker
from app.core.logging import configure_logging, get_logger
from app.models.book import Book
from app.models.user import User
from app.schemas.book import BookCreate
from app.services.auth_service import AuthService
from app.services.book_service import BookService

configure_logging()
logger = get_logger("seed")

_SEED_FILE = Path(__file__).resolve().parents[1] / "app" / "data" / "seed_books.json"
_DEMO_EMAIL = "demo@bookmind.ai"
_DEMO_PASSWORD = "bookmind123"


async def _create_tables() -> None:
    """Create tables directly (handy when not running Alembic migrations)."""
    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("tables_ready")


async def _seed_demo_user() -> None:
    async with get_sessionmaker()() as session:
        existing = await session.execute(select(User).where(User.email == _DEMO_EMAIL))
        if existing.scalar_one_or_none():
            logger.info("demo_user_exists")
            return
        auth = AuthService(session)
        from app.schemas.user import UserCreate

        await auth.register(
            UserCreate(
                email=_DEMO_EMAIL,
                username="demo",
                full_name="Demo Reader",
                password=_DEMO_PASSWORD,
            )
        )
        await session.commit()
        logger.info("demo_user_created", email=_DEMO_EMAIL, password=_DEMO_PASSWORD)


async def _seed_books() -> None:
    data = json.loads(_SEED_FILE.read_text(encoding="utf-8"))
    created = 0
    indexed = 0
    async with get_sessionmaker()() as session:
        service = BookService(session)
        for entry in data:
            existing = await session.execute(
                select(Book).where(Book.title == entry["title"])
            )
            book = existing.scalar_one_or_none()
            if book is None:
                book = await service.create_book(BookCreate(**entry), index=False)
                created += 1
            await session.commit()
            # (Re)index in the vector store regardless, so search always works.
            await session.refresh(book, attribute_names=["author", "genres"])
            service.index_book(book)
            indexed += 1
    logger.info("books_seeded", created=created, indexed=indexed, total=len(data))


async def main() -> None:
    logger.info("seed_start")
    await _create_tables()
    await _seed_books()
    await _seed_demo_user()
    logger.info("seed_complete")


if __name__ == "__main__":
    asyncio.run(main())
