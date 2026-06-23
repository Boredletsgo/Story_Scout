"""Dashboard / analytics service."""

from __future__ import annotations

from collections import Counter
from dataclasses import asdict, dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reading_history import ReadingStatus
from app.repositories.feedback import FeedbackRepository
from app.repositories.reading_history import ReadingHistoryRepository
from app.repositories.user import UserPreferenceRepository, UserRepository


@dataclass
class DashboardStats:
    books_read: int
    currently_reading: int
    want_to_read: int
    reading_streak_days: int
    reading_goal_books: int
    goal_progress_percent: int
    favorite_genres: list[str]
    recommendation_accuracy: float  # 0..1 from thumbs up / total feedback
    total_feedback: int


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.history = ReadingHistoryRepository(session)
        self.feedback = FeedbackRepository(session)
        self.prefs = UserPreferenceRepository(session)

    async def get_stats(self, user_id: int) -> dict:
        user = await self.users.get(user_id)
        books_read = await self.history.count_by_status(user_id, ReadingStatus.READ)
        reading = await self.history.count_by_status(user_id, ReadingStatus.CURRENTLY_READING)
        want = await self.history.count_by_status(user_id, ReadingStatus.WANT_TO_READ)

        feedback = await self.feedback.list_for_user(user_id)
        ups = sum(1 for f in feedback if f.feedback_type.value == "up")
        accuracy = round(ups / len(feedback), 3) if feedback else 0.0

        pref = await self.prefs.get_or_create(user_id)
        favorite_genres = pref.favorite_genres or self._infer_genres_from_history(user_id)

        goal = user.reading_goal_books if user else 12
        progress = round(min(100, (books_read / goal) * 100)) if goal else 0

        stats = DashboardStats(
            books_read=books_read,
            currently_reading=reading,
            want_to_read=want,
            reading_streak_days=user.reading_streak_days if user else 0,
            reading_goal_books=goal,
            goal_progress_percent=progress,
            favorite_genres=favorite_genres[:5],
            recommendation_accuracy=accuracy,
            total_feedback=len(feedback),
        )
        return asdict(stats)

    def _infer_genres_from_history(self, user_id: int) -> list[str]:
        # Placeholder for richer genre analytics; returns empty when no prefs set.
        return []

    async def genre_distribution(self, user_id: int) -> dict[str, int]:
        items = await self.history.list_for_user(user_id)
        counter: Counter[str] = Counter()
        for item in items:
            for genre in getattr(item.book, "genres", []) or []:
                counter[genre.name] += 1
        return dict(counter.most_common(8))
