"""Shared LangGraph state passed between agents."""

from __future__ import annotations

from typing import Any, TypedDict

from app.schemas.chat import ExtractedPreferences


class Candidate(TypedDict):
    """A book candidate flowing through the pipeline."""

    book_id: int
    title: str
    score: float
    metadata: dict[str, Any]
    reasoning: str


class AgentState(TypedDict, total=False):
    """State object mutated by each node in the recommendation graph."""

    # --- inputs ---
    user_id: int
    message: str
    history: list[dict[str, str]]
    session_id: str
    user_profile: dict[str, Any]  # persisted preferences snapshot

    # --- preference agent ---
    preferences: ExtractedPreferences
    needs_clarification: bool
    clarifying_question: str | None

    # --- recommendation agent ---
    candidates: list[Candidate]

    # --- critic agent ---
    filtered_candidates: list[Candidate]
    removed_reasons: list[str]

    # --- explanation agent ---
    final_recommendations: list[Candidate]

    # --- chat reply ---
    reply: str

    # --- bookkeeping ---
    errors: list[str]
