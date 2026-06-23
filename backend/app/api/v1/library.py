"""Library router: reading history management."""

from __future__ import annotations

from fastapi import APIRouter, Query, status
from fastapi.responses import Response

from app.api.deps import CurrentUser, LibraryServiceDep
from app.models.reading_history import ReadingStatus
from app.schemas.library import (
    LibraryItemCreate,
    LibraryItemRead,
    LibraryItemUpdate,
)

router = APIRouter(prefix="/library", tags=["library"])


@router.get("", response_model=list[LibraryItemRead])
async def list_library(
    current_user: CurrentUser,
    service: LibraryServiceDep,
    status_filter: ReadingStatus | None = Query(default=None, alias="status"),
) -> list[LibraryItemRead]:
    items = await service.list_items(current_user.id, status=status_filter)
    return [LibraryItemRead.model_validate(i) for i in items]


@router.post("", response_model=LibraryItemRead, status_code=status.HTTP_201_CREATED)
async def add_to_library(
    payload: LibraryItemCreate, current_user: CurrentUser, service: LibraryServiceDep
) -> LibraryItemRead:
    item = await service.add_or_update(current_user.id, payload)
    return LibraryItemRead.model_validate(item)


@router.patch("/{book_id}", response_model=LibraryItemRead)
async def update_library_item(
    book_id: int,
    payload: LibraryItemUpdate,
    current_user: CurrentUser,
    service: LibraryServiceDep,
) -> LibraryItemRead:
    item = await service.update_item(current_user.id, book_id, payload)
    return LibraryItemRead.model_validate(item)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def remove_library_item(
    book_id: int, current_user: CurrentUser, service: LibraryServiceDep
) -> Response:
    await service.remove_item(current_user.id, book_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
