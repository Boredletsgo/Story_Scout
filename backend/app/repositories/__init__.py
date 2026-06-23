"""Repository layer (data-access abstraction over SQLAlchemy)."""

from app.repositories.book import AuthorRepository, BookRepository, GenreRepository
from app.repositories.feedback import FeedbackRepository
from app.repositories.reading_history import ReadingHistoryRepository
from app.repositories.recommendation import RecommendationRepository
from app.repositories.user import UserPreferenceRepository, UserRepository

__all__ = [
    "UserRepository",
    "UserPreferenceRepository",
    "BookRepository",
    "AuthorRepository",
    "GenreRepository",
    "ReadingHistoryRepository",
    "RecommendationRepository",
    "FeedbackRepository",
]
