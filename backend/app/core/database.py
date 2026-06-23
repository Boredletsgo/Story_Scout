"""Async SQLAlchemy engine, session factory, and declarative base.

The engine and session factory are created lazily so importing this module does
not require a database driver to be installed at import time (helpful for tests
that swap in SQLite and for tooling that only needs the ORM metadata).
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import datetime
from functools import lru_cache

from sqlalchemy import DateTime, func
from sqlalchemy.ext.asyncio import (
    AsyncAttrs,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings


@lru_cache(maxsize=1)
def get_engine() -> AsyncEngine:
    """Create (once) and return the async engine."""
    uri = settings.sqlalchemy_database_uri
    # SQLite uses NullPool and rejects QueuePool-only sizing arguments.
    pool_kwargs: dict[str, object] = {}
    if not uri.startswith("sqlite"):
        pool_kwargs = {"pool_size": 10, "max_overflow": 20}
    return create_async_engine(
        uri,
        echo=False,
        pool_pre_ping=True,
        **pool_kwargs,
    )


@lru_cache(maxsize=1)
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Create (once) and return the async session factory."""
    return async_sessionmaker(
        bind=get_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


class Base(AsyncAttrs, DeclarativeBase):
    """Declarative base with shared timestamp columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session."""
    factory = get_sessionmaker()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
