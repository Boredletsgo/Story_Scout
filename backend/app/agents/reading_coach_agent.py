"""Agent 6 - Reading Coach Agent.

Encourages reading habits, generates realistic reading goals, builds reading
plans, and surfaces progress insights. Invoked from its own endpoint rather than
the recommendation graph, since coaching is a distinct user intent.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.agents.base import invoke_llm
from app.core.logging import get_logger
from app.mlops.prompts import get_prompt

logger = get_logger(__name__)

_SYSTEM = "You are an encouraging, practical reading coach."


@dataclass
class CoachContext:
    profile_summary: str
    books_read: int
    streak_days: int
    goal_books: int


async def generate_coaching(ctx: CoachContext) -> str:
    """Produce a short, motivating reading-coach message + next step."""
    prompt = get_prompt("reading_coach")
    user_msg = prompt.template.format(
        profile=ctx.profile_summary or "an enthusiastic reader",
        books_read=ctx.books_read,
        streak=ctx.streak_days,
        goal=ctx.goal_books,
    )
    try:
        return await invoke_llm(
            agent="reading_coach_agent",
            prompt_name=prompt.name,
            prompt_version=prompt.version,
            system=_SYSTEM,
            user=user_msg,
            temperature=0.6,
            max_tokens=180,
        )
    except Exception as exc:  # pragma: no cover - provider dependent
        logger.warning("coach_failed", error=str(exc))
        remaining = max(0, ctx.goal_books - ctx.books_read)
        return (
            f"You've read {ctx.books_read} of {ctx.goal_books} books and you're on a "
            f"{ctx.streak_days}-day streak - nice momentum! Try 20 minutes today to keep "
            f"it alive. Just {remaining} to go; one chapter at a time gets you there."
        )
