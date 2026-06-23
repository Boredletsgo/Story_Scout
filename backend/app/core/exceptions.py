"""Domain and application exceptions plus FastAPI exception handlers."""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import ORJSONResponse

from app.core.logging import get_logger

logger = get_logger(__name__)


class StoryScoutError(Exception):
    """Base application error."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None) -> None:
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class NotFoundError(StoryScoutError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found."


class ConflictError(StoryScoutError):
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource already exists."


class AuthenticationError(StoryScoutError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Could not validate credentials."


class PermissionError_(StoryScoutError):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Not enough permissions."


class ValidationError(StoryScoutError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation failed."


class LLMProviderError(StoryScoutError):
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "LLM provider error."


def register_exception_handlers(app: FastAPI) -> None:
    """Attach handlers that convert exceptions into JSON responses."""

    @app.exception_handler(StoryScoutError)
    async def _handle_storyscout_error(_: Request, exc: StoryScoutError) -> ORJSONResponse:
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
