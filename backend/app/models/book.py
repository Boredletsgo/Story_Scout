"""Book model and the book<->genre association table."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.author import Author
    from app.models.genre import Genre

# Many-to-many association: a book has many genres, a genre has many books.
book_genres = Table(
    "book_genres",
    Base.metadata,
    Column("book_id", ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("genre_id", ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
)


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(512), index=True, nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(512), nullable=True)
    isbn: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("authors.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Discovery metadata used by recommendation/critic agents.
    mood: Mapped[str | None] = mapped_column(String(128), nullable=True)
    pacing: Mapped[str | None] = mapped_column(String(64), nullable=True)
    themes: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated
    tropes: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated

    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    published_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    average_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ratings_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)

    author: Mapped[Author | None] = relationship(back_populates="books", lazy="selectin")
    genres: Mapped[list[Genre]] = relationship(
        secondary=book_genres, back_populates="books", lazy="selectin"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Book id={self.id} title={self.title!r}>"
