"""Domain and application exceptions plus FastAPI exception handlers."""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import ORJSONResponse

from app.core.logging import get_logger

logger = get_logger(__name__)


class BookMindError(Exception):
    """Base application error."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None) -> None:
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class NotFoundError(BookMindError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found."


class ConflictError(BookMindError):
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource already exists."


class AuthenticationError(BookMindError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Could not validate credentials."


class PermissionError_(BookMindError):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Not enough permissions."


class ValidationError(BookMindError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation failed."


class LLMProviderError(BookMindError):
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "LLM provider error."


def register_exception_handlers(app: FastAPI) -> None:
    """Attach handlers that convert exceptions into JSON responses."""

    @app.exception_handler(BookMindError)
    async def _handle_bookmind_error(_: Request, exc: BookMindError) -> ORJSONResponse:
        return ORJSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "type": exc.__class__.__name__},
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(request: Request, exc: Exception) -> ORJSONResponse:
        logger.error("unhandled_exception", path=str(request.url), error=str(exc))
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error.", "type": "InternalServerError"},
        )
