"""Feedback service (thumbs up/down -> learning signal)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.models.feedback import Feedback, FeedbackType
from app.repositories.book import BookRepository
from app.repositories.feedback import FeedbackRepository
from app.repositories.user import UserPreferenceRepository
from app.schemas.feedback import FeedbackCreate

logger = get_logger(__name__)


class FeedbackService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.feedback = FeedbackRepository(session)
        self.books = BookRepository(session)
        self.prefs = UserPreferenceRepository(session)

    async def submit(self, user_id: int, payload: FeedbackCreate) -> Feedback:
        book = await self.books.get(payload.book_id)
        if not book:
            raise NotFoundError("Book not found.")

        entry = await self.feedback.upsert(
            user_id=user_id,
            book_id=payload.book_id,
            feedback_type=payload.feedback_type.value,
            reason=payload.reason,
        )
        # A thumbs-down nudges the Memory agent: capture disliked tropes.
        if payload.feedback_type == FeedbackType.DOWN and book.tropes:
            await self._learn_dislikes(user_id, book.tropes)
        logger.info(
            "feedback_recorded",
            user_id=user_id,
            book_id=payload.book_id,
            type=payload.feedback_type.value,
        )
        return entry

    async def _learn_dislikes(self, user_id: int, tropes_csv: str) -> None:
        pref = await self.prefs.get_or_create(user_id)
        disliked = set(pref.disliked_tropes or [])
        for trope in (t.strip() for t in tropes_csv.split(",")):
            if trope:
                disliked.add(trope)
        pref.disliked_tropes = sorted(disliked)
        await self.prefs.save()
