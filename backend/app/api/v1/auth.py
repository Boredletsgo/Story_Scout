"""Auth router: register, login, refresh, password reset."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import AuthServiceDep, CurrentUser
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    Token,
)
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, service: AuthServiceDep) -> UserRead:
    user = await service.register(payload)
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, service: AuthServiceDep) -> Token:
    user = await service.authenticate(payload.email, payload.password)
    return service.issue_tokens(user)


@router.post("/login/form", response_model=Token, include_in_schema=False)
async def login_form(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], service: AuthServiceDep
) -> Token:
    """OAuth2 password flow so the Swagger 'Authorize' button works.

    Treats the form ``username`` field as the email.
    """
    user = await service.authenticate(form.username, form.password)
    return service.issue_tokens(user)


@router.post("/refresh", response_model=Token)
async def refresh(refresh_token: str, service: AuthServiceDep) -> Token:
    return await service.refresh(refresh_token)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(payload: ForgotPasswordRequest, service: AuthServiceDep) -> dict:
    token = await service.create_reset_token(payload.email)
    # In production this token is emailed. We return it only in dev to ease testing.
    from app.core.config import settings

    response: dict[str, str] = {
        "message": "If the email exists, a reset link has been sent."
    }
    if not settings.is_production and token:
        response["reset_token"] = token
    return response


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPasswordRequest, service: AuthServiceDep) -> dict:
    await service.reset_password(payload.token, payload.new_password)
    return {"message": "Password updated successfully."}


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
