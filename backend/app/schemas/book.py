"""Book, author, and genre schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class GenreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class AuthorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    bio: str | None = None
    photo_url: str | None = None


class BookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    subtitle: str | None = None
    cover_url: str | None = None
    description: str | None = None
    mood: str | None = None
    pacing: str | None = None
    average_rating: float
    ratings_count: int
    published_year: int | None = None
    page_count: int | None = None
    author: AuthorRead | None = None
    genres: list[GenreRead] = []


class BookDetail(BookRead):
    isbn: str | None = None
    themes: str | None = None
    tropes: str | None = None
    similar_books: list["BookRead"] = []


class BookCreate(BaseModel):
    title: str
    subtitle: str | None = None
    isbn: str | None = None
    description: str | None = None
    cover_url: str | None = None
    author_name: str | None = None
    genres: list[str] = Field(default_factory=list)
    mood: str | None = None
    pacing: str | None = None
    themes: str | None = None
    tropes: str | None = None
    page_count: int | None = None
    published_year: int | None = None
    average_rating: float = 0.0
    ratings_count: int = 0


BookDetail.model_rebuild()
