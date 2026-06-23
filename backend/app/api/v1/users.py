"""Users router: profile and preferences."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser, UserServiceDep
from app.schemas.user import (
    PreferenceRead,
    PreferenceUpdate,
    UserRead,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate, current_user: CurrentUser, service: UserServiceDep
) -> UserRead:
    user = await service.update_profile(current_user.id, payload)
    return UserRead.model_validate(user)


@router.get("/me/preferences", response_model=PreferenceRead)
async def get_preferences(current_user: CurrentUser, service: UserServiceDep) -> PreferenceRead:
    pref = await service.get_preferences(current_user.id)
    return PreferenceRead.model_validate(pref)


@router.put("/me/preferences", response_model=PreferenceRead)
async def update_preferences(
    payload: PreferenceUpdate, current_user: CurrentUser, service: UserServiceDep
) -> PreferenceRead:
    pref = await service.update_preferences(current_user.id, payload)
    return PreferenceRead.model_validate(pref)
