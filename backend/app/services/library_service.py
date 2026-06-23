"""Library (reading history) service."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.reading_history import ReadingHistory, ReadingStatus
from app.repositories.book import BookRepository
from app.repositories.reading_history import ReadingHistoryRepository
from app.schemas.library import LibraryItemCreate, LibraryItemUpdate


class LibraryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.history = ReadingHistoryRepository(session)
        self.books = BookRepository(session)

    async def list_items(
        self, user_id: int, *, status: ReadingStatus | None = None
    ) -> list[ReadingHistory]:
        return await self.history.list_for_user(user_id, status=status)

    async def add_or_update(
        self, user_id: int, payload: LibraryItemCreate
    ) -> ReadingHistory:
        if not await self.books.get(payload.book_id):
            raise NotFoundError("Book not found.")

        entry = await self.history.get_entry(user_id, payload.book_id)
        if entry:
            entry.status = payload.status
        else:
            entry = ReadingHistory(
                user_id=user_id, book_id=payload.book_id, status=payload.status
            )
            entry = await self.history.add(entry)
        self._apply_status_side_effects(entry)
        await self.history.save()
        return entry

    async def update_item(
        self, user_id: int, book_id: int, payload: LibraryItemUpdate
    ) -> ReadingHistory:
        entry = await self.history.get_entry(user_id, book_id)
        if not entry:
            raise NotFoundError("Library item not found.")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(entry, field, value)
        self._apply_status_side_effects(entry)
        await self.history.save()
        return entry

    async def remove_item(self, user_id: int, book_id: int) -> None:
        entry = await self.history.get_entry(user_id, book_id)
        if not entry:
            raise NotFoundError("Library item not found.")
        await self.session.delete(entry)
        await self.history.save()

    @staticmethod
    def _apply_status_side_effects(entry: ReadingHistory) -> None:
        now = datetime.now(UTC)
        if entry.status == ReadingStatus.CURRENTLY_READING and entry.started_at is None:
            entry.started_at = now
        if entry.status == ReadingStatus.READ:
            entry.progress_percent = 100
            if entry.finished_at is None:
                entry.finished_at = now
