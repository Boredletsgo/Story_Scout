"""Memory service: load a user's durable profile and persist agent deltas."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.reading_history import ReadingStatus
from app.repositories.reading_history import ReadingHistoryRepository
from app.repositories.user import UserPreferenceRepository

logger = get_logger(__name__)


class MemoryService:
    """Bridges the (pure) Memory agent with persistent Postgres storage."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.prefs = UserPreferenceRepository(session)
        self.history = ReadingHistoryRepository(session)

    async def load_profile(self, user_id: int) -> dict[str, Any]:
        """Build the profile snapshot consumed by the agent graph."""
        pref = await self.prefs.get_or_create(user_id)
        read = await self.history.list_for_user(user_id, status=ReadingStatus.READ)
        return {
            "favorite_genres": pref.favorite_genres or [],
            "preferred_moods": pref.preferred_moods or [],
            "preferred_pacing": pref.preferred_pacing,
            "favorite_themes": pref.favorite_themes or [],
            "disliked_tropes": pref.disliked_tropes or [],
            "reading_goals": pref.reading_goals or [],
            "profile_summary": pref.profile_summary,
            "read_book_ids": [h.book_id for h in read],
        }

    async def persist_delta(self, user_id: int, delta: dict[str, Any]) -> None:
        """Persist the Memory agent's merged profile delta."""
        pref = await self.prefs.get_or_create(user_id)
        for field in (
            "favorite_genres",
            "preferred_moods",
            "preferred_pacing",
            "favorite_themes",
            "disliked_tropes",
            "reading_goals",
        ):
            if field in delta and delta[field] is not None:
                setattr(pref, field, delta[field])
        await self.prefs.save()
        logger.info("profile_delta_persisted", user_id=user_id)
