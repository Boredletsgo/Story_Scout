"""Book catalog service: CRUD, search, detail, similar-book discovery, indexing."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.models.book import Book
from app.repositories.book import AuthorRepository, BookRepository, GenreRepository
from app.rag.retriever import book_to_document, get_retriever
from app.schemas.book import BookCreate

logger = get_logger(__name__)


class BookService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.books = BookRepository(session)
        self.authors = AuthorRepository(session)
        self.genres = GenreRepository(session)

    async def list_books(self, *, offset: int = 0, limit: int = 24) -> list[Book]:
        return await self.books.list(
            offset=offset, limit=limit, order_by=Book.average_rating.desc()
        )

    async def get_book(self, book_id: int) -> Book:
        book = await self.books.get(book_id)
        if not book:
            raise NotFoundError("Book not found.")
        return book

    async def search(self, query: str, *, limit: int = 24) -> list[Book]:
        return await self.books.search(query, limit=limit)

    async def similar_books(self, book_id: int, *, limit: int = 6) -> list[Book]:
        book = await self.get_book(book_id)
        author_name = book.author.name if book.author else None
        genres = [g.name for g in book.genres]
        query = book_to_document(
            title=book.title,
            author=author_name,
            description=book.description,
            genres=genres,
            mood=book.mood,
            pacing=book.pacing,
            themes=book.themes,
            tropes=book.tropes,
        )
        hits = get_retriever().search(query, k=limit + 1)
        ids = [h.book_id for h in hits if h.book_id != book_id][:limit]
        return await self.books.get_many_by_ids(ids)

    async def create_book(self, payload: BookCreate, *, index: bool = True) -> Book:
        author = None
        if payload.author_name:
            author = await self.authors.get_or_create(payload.author_name)

        book = Book(
            title=payload.title,
            subtitle=payload.subtitle,
            isbn=payload.isbn,
            description=payload.description,
            cover_url=payload.cover_url,
            author_id=author.id if author else None,
            mood=payload.mood,
            pacing=payload.pacing,
            themes=payload.themes,
            tropes=payload.tropes,
            page_count=payload.page_count,
            published_year=payload.published_year,
            average_rating=payload.average_rating,
            ratings_count=payload.ratings_count,
        )
        for genre_name in payload.genres:
            genre = await self.genres.get_or_create(genre_name)
            book.genres.append(genre)

        book = await self.books.add(book)
        if index:
            self.index_book(book)
        return book

    def index_book(self, book: Book) -> None:
        """Upsert a book document into the vector store (best-effort)."""
        try:
            author_name = book.author.name if book.author else None
            genres = [g.name for g in book.genres]
            document = book_to_document(
                title=book.title,
                author=author_name,
                description=book.description,
                genres=genres,
                mood=book.mood,
                pacing=book.pacing,
                themes=book.themes,
                tropes=book.tropes,
            )
            metadata = {
                "title": book.title,
                "author": author_name or "",
                "genres": ", ".join(genres),
                "mood": book.mood or "",
                "pacing": book.pacing or "",
                "themes": book.themes or "",
                "tropes": book.tropes or "",
                "average_rating": book.average_rating,
            }
            get_retriever().upsert_book(book_id=book.id, document=document, metadata=metadata)
        except Exception as exc:  # pragma: no cover - infra dependent
            logger.warning("book_index_failed", book_id=book.id, error=str(exc))
