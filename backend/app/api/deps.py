"""FastAPI dependencies: DB session, current user, and service injection."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.core.security import TokenType, decode_token
from app.models.user import User
from app.repositories.user import UserRepository
from app.services.auth_service import AuthService
from app.services.book_service import BookService
from app.services.chat_service import ChatService
from app.services.dashboard_service import DashboardService
from app.services.feedback_service import FeedbackService
from app.services.library_service import LibraryService
from app.services.user_service import UserService

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=False
)

DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    session: DBSession,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    if not token:
        raise AuthenticationError("Not authenticated.")
    payload = decode_token(token, TokenType.ACCESS)
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload.")
    user = await UserRepository(session).get(int(user_id))
    if user is None or not user.is_active:
        raise AuthenticationError("User not found or inactive.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# --- service providers ------------------------------------------------------
def get_auth_service(session: DBSession) -> AuthService:
    return AuthService(session)


def get_user_service(session: DBSession) -> UserService:
    return UserService(session)


def get_book_service(session: DBSession) -> BookService:
    return BookService(session)


def get_library_service(session: DBSession) -> LibraryService:
    return LibraryService(session)


def get_feedback_service(session: DBSession) -> FeedbackService:
    return FeedbackService(session)


def get_chat_service(session: DBSession) -> ChatService:
    return ChatService(session)


def get_dashboard_service(session: DBSession) -> DashboardService:
    return DashboardService(session)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
BookServiceDep = Annotated[BookService, Depends(get_book_service)]
LibraryServiceDep = Annotated[LibraryService, Depends(get_library_service)]
FeedbackServiceDep = Annotated[FeedbackService, Depends(get_feedback_service)]
ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
DashboardServiceDep = Annotated[DashboardService, Depends(get_dashboard_service)]
