"""Feedback repository."""

from __future__ import annotations

from sqlalchemy import select

from app.models.feedback import Feedback
from app.repositories.base import BaseRepository


class FeedbackRepository(BaseRepository[Feedback]):
    model = Feedback

    async def list_for_user(self, user_id: int) -> list[Feedback]:
        stmt = select(Feedback).where(Feedback.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert(
        self, user_id: int, book_id: int, feedback_type: str, reason: str | None
    ) -> Feedback:
        existing = await self.get_by(user_id=user_id, book_id=book_id)
        if existing:
            existing.feedback_type = feedback_type  # type: ignore[assignment]
            existing.reason = reason
            await self.session.flush()
            return existing
        return await self.add(
            Feedback(
                user_id=user_id,
                book_id=book_id,
                feedback_type=feedback_type,  # type: ignore[arg-type]
                reason=reason,
            )
        )
