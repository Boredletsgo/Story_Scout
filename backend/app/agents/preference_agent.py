"""Agent 1 - User Preference Agent.

Extracts genre, mood/tone, pacing, themes, tropes, dislikes, reading goals, and
"similar to" signals from the conversation. Flags when the request is too vague
and proposes a clarifying question (e.g. "Contemporary or fantasy romance?").
"""

from __future__ import annotations

import json

from pydantic import ValidationError

from app.agents.base import invoke_llm, parse_json_object
from app.agents.state import AgentState
from app.core.logging import get_logger
from app.mlops.prompts import get_prompt
from app.schemas.chat import ExtractedPreferences

logger = get_logger(__name__)

_SYSTEM = "You extract structured reading preferences. Output strict JSON only."


def _format_history(history: list[dict[str, str]]) -> str:
    if not history:
        return "(no prior messages)"
    return "\n".join(f"{m.get('role', 'user')}: {m.get('content', '')}" for m in history[-8:])


async def preference_node(state: AgentState) -> AgentState:
    """LangGraph node: populate ``preferences`` on the state."""
    prompt = get_prompt("preference_extraction")
    profile = json.dumps(state.get("user_profile", {}), ensure_ascii=False)
    user_msg = prompt.template.format(
        profile=profile,
        history=_format_history(state.get("history", [])),
        message=state["message"],
    )

    raw = await invoke_llm(
        agent="preference_agent",
        prompt_name=prompt.name,
        prompt_version=prompt.version,
        system=_SYSTEM,
        user=user_msg,
        temperature=0.1,
    )
    data = parse_json_object(raw)

    try:
        prefs = ExtractedPreferences(**data) if data else ExtractedPreferences()
    except ValidationError as exc:
        logger.warning("preference_validation_failed", error=str(exc))
        prefs = ExtractedPreferences()

    # Merge persisted dislikes so the critic always honors them.
    persisted = state.get("user_profile", {})
    persisted_dislikes = persisted.get("disliked_tropes", []) or []
    prefs.disliked_tropes = sorted({*prefs.disliked_tropes, *persisted_dislikes})

    state["preferences"] = prefs
    state["needs_clarification"] = prefs.needs_clarification
    state["clarifying_question"] = prefs.clarifying_question
    logger.info(
        "preferences_extracted",
        genre=prefs.genre,
        tone=prefs.tone,
        pacing=prefs.pacing,
        clarify=prefs.needs_clarification,
    )
    return state
