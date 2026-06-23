"""Agentic AI system (LangGraph).

Six cooperating agents:

1. :class:`~app.agents.preference_agent` - extract structured preferences
2. :class:`~app.agents.recommendation_agent` - retrieve & rank candidates
3. :class:`~app.agents.critic_agent` - filter unsuitable books
4. :class:`~app.agents.explanation_agent` - generate reasoning per pick
5. :class:`~app.agents.memory_agent` - persist & learn from preferences
6. :class:`~app.agents.reading_coach_agent` - habits, goals, reading plans

Orchestrated by :func:`app.agents.graph.build_recommendation_graph`.
"""

from app.agents.graph import RecommendationPipeline, build_recommendation_graph
from app.agents.state import AgentState

__all__ = ["AgentState", "RecommendationPipeline", "build_recommendation_graph"]
