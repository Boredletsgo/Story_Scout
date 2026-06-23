"""Books router: list, search, detail, similar, create."""

from __future__ import annotations

from fastapi import APIRouter, Query, status

from app.api.deps import BookServiceDep, CurrentUser
from app.schemas.book import BookCreate, BookDetail, BookRead

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[BookRead])
async def list_books(
    service: BookServiceDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
) -> list[BookRead]:
    books = await service.list_books(offset=offset, limit=limit)
    return [BookRead.model_validate(b) for b in books]


@router.get("/search", response_model=list[BookRead])
async def search_books(
    service: BookServiceDep,
    q: str = Query(..., min_length=1),
    limit: int = Query(24, ge=1, le=100),
) -> list[BookRead]:
    books = await service.search(q, limit=limit)
    return [BookRead.model_validate(b) for b in books]


@router.get("/{book_id}", response_model=BookDetail)
async def get_book(book_id: int, service: BookServiceDep) -> BookDetail:
    book = await service.get_book(book_id)
    similar = await service.similar_books(book_id)
    detail = BookDetail.model_validate(book)
    detail.similar_books = [BookRead.model_validate(b) for b in similar]
    return detail


@router.get("/{book_id}/similar", response_model=list[BookRead])
async def similar_books(
    book_id: int, service: BookServiceDep, limit: int = Query(6, ge=1, le=20)
) -> list[BookRead]:
    books = await service.similar_books(book_id, limit=limit)
    return [BookRead.model_validate(b) for b in books]


@router.post("", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def create_book(
    payload: BookCreate, service: BookServiceDep, _: CurrentUser
) -> BookRead:
    book = await service.create_book(payload)
    return BookRead.model_validate(book)
