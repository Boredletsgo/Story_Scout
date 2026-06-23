"""Shared helpers for agent LLM calls (invocation, tracking, JSON parsing)."""

from __future__ import annotations

import json
import re
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.core.logging import get_logger
from app.llm import get_chat_model
from app.mlops.tracking import Timer, track_llm_call

logger = get_logger(__name__)

# Rough heuristic when providers don't return usage metadata (e.g. Ollama).
_CHARS_PER_TOKEN = 4


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // _CHARS_PER_TOKEN)


async def invoke_llm(
    *,
    agent: str,
    prompt_name: str,
    prompt_version: str,
    system: str,
    user: str,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str:
    """Invoke the configured chat model and record MLflow metrics."""
    model = get_chat_model(temperature=temperature, max_tokens=max_tokens)
    messages: list[BaseMessage] = [SystemMessage(content=system), HumanMessage(content=user)]

    with Timer() as timer:
        response = await model.ainvoke(messages)

    content = response.content if isinstance(response.content, str) else str(response.content)

    usage = getattr(response, "usage_metadata", None) or {}
    input_tokens = int(usage.get("input_tokens") or _estimate_tokens(system + user))
    output_tokens = int(usage.get("output_tokens") or _estimate_tokens(content))

    track_llm_call(
        agent=agent,
        prompt_name=prompt_name,
        prompt_version=prompt_version,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=timer.elapsed_ms,
    )
    return content.strip()


def parse_json_object(text: str) -> dict[str, Any]:
    """Best-effort extraction of a JSON object from an LLM response."""
    text = text.strip()
    # strip code fences if present
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                logger.warning("json_parse_failed", snippet=text[:200])
        return {}
