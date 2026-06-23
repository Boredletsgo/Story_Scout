"""User profile & preferences service."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.models.user_preference import UserPreference
from app.repositories.user import UserPreferenceRepository, UserRepository
from app.schemas.user import PreferenceUpdate, UserUpdate


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.prefs = UserPreferenceRepository(session)

    async def get(self, user_id: int) -> User:
        user = await self.users.get(user_id)
        if not user:
            raise NotFoundError("User not found.")
        return user

    async def update_profile(self, user_id: int, payload: UserUpdate) -> User:
        user = await self.get(user_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.users.save()
        return user

    async def get_preferences(self, user_id: int) -> UserPreference:
        return await self.prefs.get_or_create(user_id)

    async def update_preferences(
        self, user_id: int, payload: PreferenceUpdate
    ) -> UserPreference:
        pref = await self.prefs.get_or_create(user_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(pref, field, value)
        await self.prefs.save()
        return pref
