"""Book, author, and genre repositories."""

from __future__ import annotations

from sqlalchemy import or_, select

from app.models.author import Author
from app.models.book import Book
from app.models.genre import Genre
from app.repositories.base import BaseRepository


class BookRepository(BaseRepository[Book]):
    model = Book

    async def search(self, query: str, *, limit: int = 20) -> list[Book]:
        like = f"%{query}%"
        stmt = (
            select(Book)
            .where(or_(Book.title.ilike(like), Book.description.ilike(like)))
            .order_by(Book.average_rating.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_many_by_ids(self, ids: list[int]) -> list[Book]:
        if not ids:
            return []
        stmt = select(Book).where(Book.id.in_(ids))
        result = await self.session.execute(stmt)
        books = {b.id: b for b in result.scalars().all()}
        # preserve incoming order (ranking from the vector store)
        return [books[i] for i in ids if i in books]

    async def top_rated(self, *, limit: int = 10) -> list[Book]:
        stmt = select(Book).order_by(Book.average_rating.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class AuthorRepository(BaseRepository[Author]):
    model = Author

    async def get_or_create(self, name: str) -> Author:
        author = await self.get_by(name=name)
        if author is None:
            author = await self.add(Author(name=name))
        return author


class GenreRepository(BaseRepository[Genre]):
    model = Genre

    async def get_or_create(self, name: str) -> Genre:
        slug = name.strip().lower().replace(" ", "-").replace("/", "-")
        genre = await self.get_by(slug=slug)
        if genre is None:
            genre = await self.add(Genre(name=name.strip(), slug=slug))
        return genre
