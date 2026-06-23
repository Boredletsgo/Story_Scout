"""Integration tests for books, library, feedback, and the chat pipeline."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

_BOOK = {
    "title": "Test Romantasy",
    "author_name": "A. Writer",
    "genres": ["Fantasy Romance"],
    "description": "An emotional slow-burn fantasy romance with found family.",
    "mood": "Emotional",
    "pacing": "Medium",
    "themes": "found family",
    "tropes": "slow burn",
    "average_rating": 4.6,
    "ratings_count": 1000,
}


@pytest.mark.asyncio
async def test_create_and_get_book(auth_client: AsyncClient, fake_retriever) -> None:
    created = await auth_client.post("/api/v1/books", json=_BOOK)
    assert created.status_code == 201
    book_id = created.json()["id"]

    fetched = await auth_client.get(f"/api/v1/books/{book_id}")
    assert fetched.status_code == 200
    assert fetched.json()["title"] == "Test Romantasy"


@pytest.mark.asyncio
async def test_library_flow(auth_client: AsyncClient, fake_retriever) -> None:
    book_id = (await auth_client.post("/api/v1/books", json=_BOOK)).json()["id"]

    add = await auth_client.post(
        "/api/v1/library", json={"book_id": book_id, "status": "want_to_read"}
    )
    assert add.status_code == 201

    update = await auth_client.patch(
        f"/api/v1/library/{book_id}", json={"status": "read", "user_rating": 5}
    )
    assert update.status_code == 200
    assert update.json()["status"] == "read"
    assert update.json()["progress_percent"] == 100

    listing = await auth_client.get("/api/v1/library?status=read")
    assert listing.status_code == 200
    assert len(listing.json()) == 1


@pytest.mark.asyncio
async def test_feedback_learns_dislikes(auth_client: AsyncClient, fake_retriever) -> None:
    book_id = (await auth_client.post("/api/v1/books", json=_BOOK)).json()["id"]
    resp = await auth_client.post(
        "/api/v1/feedback", json={"book_id": book_id, "feedback_type": "down"}
    )
    assert resp.status_code == 201

    prefs = await auth_client.get("/api/v1/users/me/preferences")
    assert "slow burn" in prefs.json()["disliked_tropes"]


@pytest.mark.asyncio
async def test_chat_returns_recommendations(
    auth_client: AsyncClient, fake_retriever, fake_llm, monkeypatch
) -> None:
    # index a book so the retriever returns it
    book_id = (await auth_client.post("/api/v1/books", json=_BOOK)).json()["id"]
    fake_retriever.upsert_book(
        book_id=book_id,
        document="Title: Test Romantasy",
        metadata={
            "title": "Test Romantasy",
            "author": "A. Writer",
            "average_rating": 4.6,
            "themes": "found family",
            "tropes": "slow burn",
        },
    )

    # stub the streaming reply composition to avoid a real LLM call
    async def fake_stream(self, message, items):  # noqa: ANN001
        yield "Here are some books you might love."

    from app.services.chat_service import ChatService

    monkeypatch.setattr(ChatService, "_stream_reply", fake_stream)

    resp = await auth_client.post(
        "/api/v1/chat",
        json={"message": "I want emotional fantasy romance.", "stream": False},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["session_id"]
    assert len(body["recommendations"]) >= 1
    assert body["recommendations"][0]["book"]["title"] == "Test Romantasy"
