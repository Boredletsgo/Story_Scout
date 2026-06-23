"""User feedback (thumbs up / down) used to improve future recommendations."""

from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.book import Book
    from app.models.user import User


class FeedbackType(StrEnum):
    UP = "up"
    DOWN = "down"


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"), index=True, nullable=False
    )
    feedback_type: Mapped[FeedbackType] = mapped_column(
        SAEnum(FeedbackType, name="feedback_type"), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(String(512), nullable=True)

    user: Mapped[User] = relationship(back_populates="feedback")
    book: Mapped[Book] = relationship(lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Feedback user={self.user_id} book={self.book_id} {self.feedback_type}>"
