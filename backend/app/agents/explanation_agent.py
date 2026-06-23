"""Agent 4 - Explanation Agent.

Generates a short, grounded reason for each surviving recommendation, e.g.
"You may enjoy this because it combines slow-burn romance, strong character
growth, and emotional storytelling."
"""

from __future__ import annotations

import asyncio

from app.agents.base import invoke_llm
from app.agents.state import AgentState, Candidate
from app.core.logging import get_logger
from app.mlops.prompts import get_prompt

logger = get_logger(__name__)

_SYSTEM = "You write concise, warm, grounded book recommendation reasons."


def _preferences_summary(state: AgentState) -> str:
    p = state["preferences"]
    bits = []
    if p.genre:
        bits.append(p.genre)
    if p.tone:
        bits.append(f"{p.tone} tone")
    if p.pacing:
        bits.append(f"{p.pacing} pacing")
    bits.extend(p.themes[:3])
    bits.extend(p.tropes[:3])
    return ", ".join(bits) or "their stated interests"


def _book_facts(candidate: Candidate) -> str:
    meta = candidate["metadata"] or {}
    fields = ["mood", "pacing", "themes", "tropes", "genres"]
    return "; ".join(f"{f}: {meta[f]}" for f in fields if meta.get(f)) or "no extra metadata"


async def _explain_one(state: AgentState, cand: Candidate, prompt_template: str,
                       name: str, version: str) -> Candidate:
    meta = cand["metadata"] or {}
    user_msg = prompt_template.format(
        title=cand["title"],
        author=meta.get("author", "the author"),
        preferences=_preferences_summary(state),
        book_facts=_book_facts(cand),
    )
    try:
        reason = await invoke_llm(
            agent="explanation_agent",
            prompt_name=name,
            prompt_version=version,
            system=_SYSTEM,
            user=user_msg,
            temperature=0.5,
            max_tokens=120,
        )
    except Exception as exc:  # pragma: no cover - provider dependent
        logger.warning("explanation_failed", title=cand["title"], error=str(exc))
        reason = (
            f"This pick aligns with {_preferences_summary(state)}, "
            "based on its themes and tone."
        )
    cand["reasoning"] = reason
    return cand


async def explanation_node(state: AgentState) -> AgentState:
    """LangGraph node: attach reasoning, producing ``final_recommendations``."""
    prompt = get_prompt("explanation")
    candidates = state.get("filtered_candidates", [])
    if not candidates:
        state["final_recommendations"] = []
        return state

    explained = await asyncio.gather(
        *(
            _explain_one(state, cand, prompt.template, prompt.name, prompt.version)
            for cand in candidates
        )
    )
    state["final_recommendations"] = list(explained)
    logger.info("explanations_generated", count=len(explained))
    return state
