"""Pytest fixtures.

Tests run fully offline:
* SQLite (aiosqlite) in-memory database instead of Postgres.
* The LLM provider and ChromaDB retriever are monkeypatched so no external
  services or model downloads are required.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("ENABLE_MLFLOW", "false")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402

from app.agents import base as agent_base  # noqa: E402
from app.core.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.rag import retriever as retriever_mod  # noqa: E402

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def engine():  # noqa: ANN201
    eng = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session(engine) -> AsyncIterator[AsyncSession]:
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as s:
        yield s


@pytest.fixture
def fake_retriever(monkeypatch):
    """Replace the vector retriever with a deterministic in-memory stub."""

    class FakeRetriever:
        def __init__(self) -> None:
            self.store: dict[int, dict] = {}

        def search(self, query: str, *, k: int = 12, where=None):
            from app.rag.retriever import RetrievedBook

            results = []
            for book_id, payload in list(self.store.items())[:k]:
                results.append(
                    RetrievedBook(
                        book_id=book_id,
                        title=payload["metadata"].get("title", ""),
                        score=0.9,
                        metadata=payload["metadata"],
                        document=payload["document"],
                    )
                )
            return results

        def upsert_book(self, *, book_id: int, document: str, metadata: dict) -> None:
            self.store[book_id] = {"document": document, "metadata": metadata}

        def count(self) -> int:
            return len(self.store)

    stub = FakeRetriever()
    monkeypatch.setattr(retriever_mod, "get_retriever", lambda: stub)
    # also patch references already imported in services
    import app.services.book_service as bs
    import app.agents.recommendation_agent as ra

    monkeypatch.setattr(bs, "get_retriever", lambda: stub)
    monkeypatch.setattr(ra, "get_retriever", lambda: stub)
    return stub


@pytest.fixture
def fake_llm(monkeypatch):
    """Stub the agent LLM invocation so no real model is called."""

    async def fake_invoke_llm(*, agent: str, system: str, user: str, **_: object) -> str:
        if agent == "preference_agent":
            return (
                '{"genre":"Fantasy Romance","tone":"Emotional","pacing":"Medium",'
                '"themes":["found family"],"tropes":["slow burn"],'
                '"disliked_tropes":[],"reading_goals":[],"similar_to":[],'
                '"needs_clarification":false,"clarifying_question":null}'
            )
        if agent == "explanation_agent":
            return "You may enjoy this for its emotional, slow-burn storytelling."
        return "Here are some books you might love."

    monkeypatch.setattr(agent_base, "invoke_llm", fake_invoke_llm)
    import app.agents.preference_agent as pa
    import app.agents.explanation_agent as ea

    monkeypatch.setattr(pa, "invoke_llm", fake_invoke_llm)
    monkeypatch.setattr(ea, "invoke_llm", fake_invoke_llm)
    return fake_invoke_llm


@pytest_asyncio.fixture
async def client(engine) -> AsyncIterator[AsyncClient]:
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def _override_get_db() -> AsyncIterator[AsyncSession]:
        async with factory() as s:
            try:
                yield s
                await s.commit()
            except Exception:
                await s.rollback()
                raise

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    """A client with a registered + logged-in user (Bearer token set)."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "tester@bookmind.ai",
            "username": "tester",
            "full_name": "Test User",
            "password": "supersecret1",
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "tester@bookmind.ai", "password": "supersecret1"},
    )
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
