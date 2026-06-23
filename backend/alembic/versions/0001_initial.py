"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-23 00:00:00.000000
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _ts() -> tuple[sa.Column, sa.Column]:
    return (
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def upgrade() -> None:
    # ---- users ----
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("reading_level", sa.String(32), nullable=True),
        sa.Column("preferred_length", sa.String(32), nullable=True),
        sa.Column("reading_goal_books", sa.Integer(), nullable=False, server_default="12"),
        sa.Column("reading_streak_days", sa.Integer(), nullable=False, server_default="0"),
        *_ts(),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    # ---- authors ----
    op.create_table(
        "authors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(1024), nullable=True),
        *_ts(),
    )
    op.create_index("ix_authors_name", "authors", ["name"])

    # ---- genres ----
    op.create_table(
        "genres",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        *_ts(),
    )
    op.create_index("ix_genres_name", "genres", ["name"], unique=True)
    op.create_index("ix_genres_slug", "genres", ["slug"], unique=True)

    # ---- books ----
    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("subtitle", sa.String(512), nullable=True),
        sa.Column("isbn", sa.String(20), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_url", sa.String(1024), nullable=True),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("authors.id", ondelete="SET NULL"), nullable=True),
        sa.Column("mood", sa.String(128), nullable=True),
        sa.Column("pacing", sa.String(64), nullable=True),
        sa.Column("themes", sa.Text(), nullable=True),
        sa.Column("tropes", sa.Text(), nullable=True),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("published_year", sa.Integer(), nullable=True),
        sa.Column("average_rating", sa.Float(), nullable=False, server_default="0"),
        sa.Column("ratings_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("language", sa.String(8), nullable=False, server_default="en"),
        *_ts(),
    )
    op.create_index("ix_books_title", "books", ["title"])
    op.create_index("ix_books_isbn", "books", ["isbn"])
    op.create_index("ix_books_author_id", "books", ["author_id"])

    # ---- book_genres (assoc) ----
    op.create_table(
        "book_genres",
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("genre_id", sa.Integer(), sa.ForeignKey("genres.id", ondelete="CASCADE"), primary_key=True),
    )

    # ---- user_preferences ----
    op.create_table(
        "user_preferences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("favorite_genres", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("preferred_moods", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("preferred_pacing", sa.String(64), nullable=True),
        sa.Column("favorite_themes", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("disliked_tropes", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("reading_goals", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("profile_summary", sa.String(2048), nullable=True),
        *_ts(),
    )
    op.create_index("ix_user_preferences_user_id", "user_preferences", ["user_id"], unique=True)

    # ---- reading_history ----
    reading_status = sa.Enum("want_to_read", "currently_reading", "read", name="reading_status")
    op.create_table(
        "reading_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", reading_status, nullable=False, server_default="want_to_read"),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("user_rating", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        *_ts(),
    )
    op.create_index("ix_reading_history_user_id", "reading_history", ["user_id"])
    op.create_index("ix_reading_history_book_id", "reading_history", ["book_id"])

    # ---- recommendations ----
    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("query", sa.Text(), nullable=True),
        sa.Column("score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("reasoning", sa.Text(), nullable=True),
        sa.Column("session_id", sa.String(64), nullable=True),
        *_ts(),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("ix_recommendations_book_id", "recommendations", ["book_id"])
    op.create_index("ix_recommendations_session_id", "recommendations", ["session_id"])

    # ---- feedback ----
    feedback_type = sa.Enum("up", "down", name="feedback_type")
    op.create_table(
        "feedback",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id", sa.Integer(), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("feedback_type", feedback_type, nullable=False),
        sa.Column("reason", sa.String(512), nullable=True),
        *_ts(),
    )
    op.create_index("ix_feedback_user_id", "feedback", ["user_id"])
    op.create_index("ix_feedback_book_id", "feedback", ["book_id"])


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_table("recommendations")
    op.drop_table("reading_history")
    op.drop_table("user_preferences")
    op.drop_table("book_genres")
    op.drop_table("books")
    op.drop_table("genres")
    op.drop_table("authors")
    op.drop_table("users")
    sa.Enum(name="reading_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="feedback_type").drop(op.get_bind(), checkfirst=True)
