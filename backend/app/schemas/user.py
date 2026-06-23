"""User and preference schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=64)
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = None
    reading_level: str | None = None
    preferred_length: str | None = None
    reading_goal_books: int | None = Field(default=None, ge=1, le=1000)


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_superuser: bool
    reading_level: str | None = None
    preferred_length: str | None = None
    reading_goal_books: int
    reading_streak_days: int


class PreferenceUpdate(BaseModel):
    favorite_genres: list[str] | None = None
    preferred_moods: list[str] | None = None
    preferred_pacing: str | None = None
    favorite_themes: list[str] | None = None
    disliked_tropes: list[str] | None = None
    reading_goals: list[str] | None = None


class PreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    favorite_genres: list[str] = []
    preferred_moods: list[str] = []
    preferred_pacing: str | None = None
    favorite_themes: list[str] = []
    disliked_tropes: list[str] = []
    reading_goals: list[str] = []
    profile_summary: str | None = None
