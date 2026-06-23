"""User and preference repositories."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_preference import UserPreference
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        return await self.get_by(email=email)

    async def get_by_username(self, username: str) -> User | None:
        return await self.get_by(username=username)


class UserPreferenceRepository(BaseRepository[UserPreference]):
    model = UserPreference

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_for_user(self, user_id: int) -> UserPreference | None:
        return await self.get_by(user_id=user_id)

    async def get_or_create(self, user_id: int) -> UserPreference:
        pref = await self.get_for_user(user_id)
        if pref is None:
            pref = await self.add(UserPreference(user_id=user_id))
        return pref
