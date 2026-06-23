"""Agent 2 - Recommendation Agent.

Builds a rich semantic query from the extracted preferences, retrieves candidate
books from the ChromaDB vector store (RAG), and ranks them with a blended score
of semantic similarity, rating quality, and preference-signal overlap.
"""

from __future__ import annotations

from app.agents.state import AgentState, Candidate
from app.core.logging import get_logger
from app.rag.retriever import RetrievedBook, get_retriever

logger = get_logger(__name__)

_RETRIEVE_K = 16
_KEEP_TOP = 8


def _build_query(state: AgentState) -> str:
    prefs = state["preferences"]
    pieces: list[str] = [state["message"]]
    if prefs.genre:
        pieces.append(f"Genre: {prefs.genre}")
    if prefs.tone:
        pieces.append(f"Tone: {prefs.tone}")
    if prefs.pacing:
        pieces.append(f"Pacing: {prefs.pacing}")
    if prefs.themes:
        pieces.append("Themes: " + ", ".join(prefs.themes))
    if prefs.tropes:
        pieces.append("Tropes: " + ", ".join(prefs.tropes))
    if prefs.similar_to:
        pieces.append("Similar to: " + ", ".join(prefs.similar_to))
    return ". ".join(pieces)


def _rank(state: AgentState, hits: list[RetrievedBook]) -> list[Candidate]:
    prefs = state["preferences"]
    wanted = {t.lower() for t in (prefs.themes + prefs.tropes)}
    candidates: list[Candidate] = []

    for hit in hits:
        meta = hit.metadata or {}
        rating = float(meta.get("average_rating", 0.0) or 0.0)
        meta_themes = str(meta.get("themes", "")).lower()
        meta_tropes = str(meta.get("tropes", "")).lower()

        overlap = sum(1 for w in wanted if w and (w in meta_themes or w in meta_tropes))
        overlap_boost = min(0.15, 0.05 * overlap)
        rating_boost = (rating / 5.0) * 0.15

        final_score = round(min(1.0, hit.score * 0.7 + rating_boost + overlap_boost), 4)
        candidates.append(
            Candidate(
                book_id=hit.book_id,
                title=hit.title,
                score=final_score,
                metadata=meta,
                reasoning="",
            )
        )

    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates[:_KEEP_TOP]


async def recommendation_node(state: AgentState) -> AgentState:
    """LangGraph node: populate ``candidates`` via RAG retrieval + ranking."""
    query = _build_query(state)
    retriever = get_retriever()
    hits = retriever.search(query, k=_RETRIEVE_K)

    if not hits:
        logger.info("no_vector_hits", query=query[:120])
        state["candidates"] = []
        return state

    state["candidates"] = _rank(state, hits)
    logger.info("candidates_ranked", count=len(state["candidates"]))
    return state
