"""Aggregate all v1 routers under a single APIRouter."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    auth,
    books,
    chat,
    dashboard,
    feedback,
    library,
    system,
    users,
)

api_router = APIRouter()
api_router.include_router(system.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(books.router)
api_router.include_router(library.router)
api_router.include_router(feedback.router)
api_router.include_router(chat.router)
api_router.include_router(dashboard.router)
