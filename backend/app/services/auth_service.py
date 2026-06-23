"""Authentication & registration service."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.core.logging import get_logger
from app.core.security import (
    TokenType,
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user import UserPreferenceRepository, UserRepository
from app.schemas.auth import Token
from app.schemas.user import UserCreate

logger = get_logger(__name__)


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.prefs = UserPreferenceRepository(session)

    async def register(self, payload: UserCreate) -> User:
        if await self.users.get_by_email(payload.email):
            raise ConflictError("Email already registered.")
        if await self.users.get_by_username(payload.username):
            raise ConflictError("Username already taken.")

        user = User(
            email=payload.email,
            username=payload.username,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
        )
        user = await self.users.add(user)
        await self.prefs.get_or_create(user.id)
        logger.info("user_registered", user_id=user.id, email=user.email)
        return user

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.users.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationError("Incorrect email or password.")
        if not user.is_active:
            raise AuthenticationError("Account is disabled.")
        return user

    def issue_tokens(self, user: User) -> Token:
        return Token(
            access_token=create_access_token(user.id, email=user.email),
            refresh_token=create_refresh_token(user.id),
        )

    async def refresh(self, refresh_token: str) -> Token:
        payload = decode_token(refresh_token, TokenType.REFRESH)
        user = await self.users.get(int(payload["sub"]))
        if not user:
            raise AuthenticationError("User no longer exists.")
        return self.issue_tokens(user)

    async def create_reset_token(self, email: str) -> str | None:
        """Return a reset token. Returns None silently if user is unknown."""
        user = await self.users.get_by_email(email)
        if not user:
            logger.info("password_reset_unknown_email")
            return None
        token = create_password_reset_token(user.id)
        logger.info("password_reset_issued", user_id=user.id)
        return token

    async def reset_password(self, token: str, new_password: str) -> None:
        payload = decode_token(token, TokenType.RESET)
        user = await self.users.get(int(payload["sub"]))
        if not user:
            raise NotFoundError("User not found.")
        user.hashed_password = hash_password(new_password)
        await self.users.save()
        logger.info("password_reset_completed", user_id=user.id)
