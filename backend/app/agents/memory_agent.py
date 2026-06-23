"""Agent 5 - Memory Agent.

Learns from the conversation and feedback by merging newly extracted preferences
into a durable profile delta. The graph node computes the *delta* (pure, no I/O);
the service layer (:mod:`app.services.memory_service`) persists it to Postgres so
the agent graph stays free of database side effects and easy to test.
"""

from __future__ import annotations

from app.agents.state import AgentState
from app.core.logging import get_logger

logger = get_logger(__name__)


def _merge_unique(existing: list[str], new: list[str], *, limit: int = 25) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for item in [*existing, *new]:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(item.strip())
    return out[:limit]


def compute_profile_delta(state: AgentState) -> dict[str, object]:
    """Compute the merged profile from the persisted profile + new preferences."""
    profile = dict(state.get("user_profile", {}))
    prefs = state["preferences"]

    genres = profile.get("favorite_genres", []) or []
    if prefs.genre:
        genres = _merge_unique(genres, [prefs.genre])

    moods = profile.get("preferred_moods", []) or []
    if prefs.tone:
        moods = _merge_unique(moods, [prefs.tone])

    delta: dict[str, object] = {
        "favorite_genres": genres,
        "preferred_moods": moods,
        "favorite_themes": _merge_unique(profile.get("favorite_themes", []) or [], prefs.themes),
        "disliked_tropes": _merge_unique(
            profile.get("disliked_tropes", []) or [], prefs.disliked_tropes
        ),
        "reading_goals": _merge_unique(
            profile.get("reading_goals", []) or [], prefs.reading_goals
        ),
    }
    if prefs.pacing:
        delta["preferred_pacing"] = prefs.pacing
    return delta


async def memory_node(state: AgentState) -> AgentState:
    """LangGraph node: stash the computed profile delta on the state."""
    delta = compute_profile_delta(state)
    state["user_profile"] = {**state.get("user_profile", {}), **delta}
    logger.info("memory_delta_computed", keys=list(delta.keys()))
    return state
