"""Library (reading history) schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.reading_history import ReadingStatus
from app.schemas.book import BookRead


class LibraryItemCreate(BaseModel):
    book_id: int
    status: ReadingStatus = ReadingStatus.WANT_TO_READ


class LibraryItemUpdate(BaseModel):
    status: ReadingStatus | None = None
    progress_percent: int | None = Field(default=None, ge=0, le=100)
    user_rating: int | None = Field(default=None, ge=1, le=5)


class LibraryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ReadingStatus
    progress_percent: int
    user_rating: int | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    book: BookRead
