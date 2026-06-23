"""Reading history repository."""

from __future__ import annotations

from sqlalchemy import select

from app.models.reading_history import ReadingHistory, ReadingStatus
from app.repositories.base import BaseRepository


class ReadingHistoryRepository(BaseRepository[ReadingHistory]):
    model = ReadingHistory

    async def get_entry(self, user_id: int, book_id: int) -> ReadingHistory | None:
        return await self.get_by(user_id=user_id, book_id=book_id)

    async def list_for_user(
        self, user_id: int, *, status: ReadingStatus | None = None
    ) -> list[ReadingHistory]:
        stmt = select(ReadingHistory).where(ReadingHistory.user_id == user_id)
        if status is not None:
            stmt = stmt.where(ReadingHistory.status == status)
        stmt = stmt.order_by(ReadingHistory.updated_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_status(self, user_id: int, status: ReadingStatus) -> int:
        return await self.count(user_id=user_id, status=status)
