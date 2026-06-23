"""SQLAlchemy ORM models.

Importing this package registers every model on the shared ``Base.metadata``
so Alembic autogeneration and ``create_all`` can see them.
"""

from app.core.database import Base
from app.models.author import Author
from app.models.book import Book, book_genres
from app.models.feedback import Feedback, FeedbackType
from app.models.genre import Genre
from app.models.reading_history import ReadingHistory, ReadingStatus
from app.models.recommendation import Recommendation
from app.models.user import User
from app.models.user_preference import UserPreference

__all__ = [
    "Base",
    "User",
    "Author",
    "Book",
    "book_genres",
    "Genre",
    "Recommendation",
    "ReadingHistory",
    "ReadingStatus",
    "UserPreference",
    "Feedback",
    "FeedbackType",
]
