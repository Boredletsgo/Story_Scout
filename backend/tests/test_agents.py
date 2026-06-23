"""Unit tests for individual agent nodes (no external services)."""

from __future__ import annotations

import pytest

from app.agents.critic_agent import critic_node
from app.agents.memory_agent import compute_profile_delta
from app.agents.preference_agent import preference_node
from app.agents.recommendation_agent import recommendation_node
from app.agents.state import AgentState
from app.schemas.chat import ExtractedPreferences


@pytest.mark.asyncio
async def test_preference_node_extracts(fake_llm) -> None:
    state: AgentState = {
        "user_id": 1,
        "message": "I want emotional fantasy romance.",
        "history": [],
        "session_id": "s1",
        "user_profile": {},
    }
    out = await preference_node(state)
    prefs = out["preferences"]
    assert prefs.genre == "Fantasy Romance"
    assert prefs.tone == "Emotional"
    assert out["needs_clarification"] is False


@pytest.mark.asyncio
async def test_recommendation_node_ranks(fake_retriever) -> None:
    fake_retriever.upsert_book(
        book_id=10,
        document="Title: X",
        metadata={"title": "X", "average_rating": 4.5, "themes": "found family", "tropes": "slow burn"},
    )
    state: AgentState = {
        "message": "fantasy romance",
        "preferences": ExtractedPreferences(genre="Fantasy Romance", themes=["found family"]),
    }
    out = await recommendation_node(state)
    assert out["candidates"]
    assert out["candidates"][0]["book_id"] == 10


@pytest.mark.asyncio
async def test_critic_removes_disliked_tropes() -> None:
    state: AgentState = {
        "preferences": ExtractedPreferences(disliked_tropes=["love triangle"]),
        "user_profile": {"read_book_ids": []},
        "candidates": [
            {"book_id": 1, "title": "Has Triangle", "score": 0.8,
             "metadata": {"tropes": "love triangle, slow burn"}, "reasoning": ""},
            {"book_id": 2, "title": "Clean", "score": 0.7,
             "metadata": {"tropes": "slow burn"}, "reasoning": ""},
        ],
    }
    out = await critic_node(state)
    kept_ids = {c["book_id"] for c in out["filtered_candidates"]}
    assert kept_ids == {2}
    assert any("love triangle" in r for r in out["removed_reasons"])


def test_memory_delta_merges_preferences() -> None:
    state: AgentState = {
        "user_profile": {"favorite_genres": ["Fantasy"], "disliked_tropes": []},
        "preferences": ExtractedPreferences(
            genre="Romance", themes=["healing"], disliked_tropes=["insta-love"]
        ),
    }
    delta = compute_profile_delta(state)
    assert "Fantasy" in delta["favorite_genres"]
    assert "Romance" in delta["favorite_genres"]
    assert "healing" in delta["favorite_themes"]
    assert "insta-love" in delta["disliked_tropes"]
