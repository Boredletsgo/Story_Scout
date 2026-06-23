"""Pydantic schemas (request/response DTOs)."""

from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    Token,
    TokenPayload,
)
from app.schemas.book import (
    AuthorRead,
    BookCreate,
    BookDetail,
    BookRead,
    GenreRead,
)
from app.schemas.chat import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    RecommendationItem,
)
from app.schemas.feedback import FeedbackCreate, FeedbackRead
from app.schemas.library import (
    LibraryItemCreate,
    LibraryItemRead,
    LibraryItemUpdate,
)
from app.schemas.user import (
    PreferenceRead,
    PreferenceUpdate,
    UserCreate,
    UserRead,
    UserUpdate,
)

__all__ = [
    "Token",
    "TokenPayload",
    "LoginRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "UserCreate",
    "UserRead",
    "UserUpdate",
    "PreferenceRead",
    "PreferenceUpdate",
    "BookRead",
    "BookDetail",
    "BookCreate",
    "AuthorRead",
    "GenreRead",
    "LibraryItemCreate",
    "LibraryItemRead",
    "LibraryItemUpdate",
    "FeedbackCreate",
    "FeedbackRead",
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "RecommendationItem",
]
