"""User reading-preference profile (maintained by the Preference & Memory agents)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    # Stored as JSON arrays so the Memory agent can update them flexibly.
    favorite_genres: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    preferred_moods: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    preferred_pacing: Mapped[str | None] = mapped_column(String(64), nullable=True)
    favorite_themes: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    disliked_tropes: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    reading_goals: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Free-form profile summary maintained by the Memory agent.
    profile_summary: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    user: Mapped[User] = relationship(back_populates="preferences")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<UserPreference user_id={self.user_id}>"
