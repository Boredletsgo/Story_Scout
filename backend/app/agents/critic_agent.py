"""Agent 3 - Critic Agent.

Validates candidate quality and consistency with the user's profile. Removes
books that contain disliked tropes (e.g. "love triangle"), fall below a quality
floor, or duplicate something already read. This is a deterministic, rule-based
guard so it is fast, predictable, and cheap (no LLM call required).
"""

from __future__ import annotations

from app.agents.state import AgentState, Candidate
from app.core.logging import get_logger

logger = get_logger(__name__)

_MIN_SCORE = 0.15


def _violates_dislikes(candidate: Candidate, disliked: set[str]) -> str | None:
    meta = candidate["metadata"] or {}
    haystack = " ".join(
        str(meta.get(field, "")).lower() for field in ("tropes", "themes", "mood")
    )
    for trope in disliked:
        if trope and trope.lower() in haystack:
            return trope
    return None


async def critic_node(state: AgentState) -> AgentState:
    """LangGraph node: filter candidates into ``filtered_candidates``."""
    prefs = state["preferences"]
    disliked = {t for t in prefs.disliked_tropes if t}
    already_read: set[int] = set(state.get("user_profile", {}).get("read_book_ids", []))

    kept: list[Candidate] = []
    removed: list[str] = []
    seen: set[int] = set()

    for cand in state.get("candidates", []):
        if cand["book_id"] in seen:
            continue
        seen.add(cand["book_id"])

        if cand["book_id"] in already_read:
            removed.append(f"{cand['title']}: already read")
            continue
        if cand["score"] < _MIN_SCORE:
            removed.append(f"{cand['title']}: low relevance")
            continue
        violated = _violates_dislikes(cand, disliked)
        if violated:
            removed.append(f"{cand['title']}: contains disliked '{violated}'")
            continue
        kept.append(cand)

    state["filtered_candidates"] = kept[:5]
    state["removed_reasons"] = removed
    logger.info("critic_filtered", kept=len(state["filtered_candidates"]), removed=len(removed))
    return state
