"""LangGraph orchestration of the recommendation pipeline.

Flow::

    preference ──(needs clarification?)──> clarify ──> END
        │ no
        ▼
    recommendation ──> critic ──> explanation ──> memory ──> END

The graph is compiled once and reused. Persisting the memory delta and turning
candidates into DB-backed recommendations happens in the service layer.
"""

from __future__ import annotations

from functools import lru_cache

from langgraph.graph import END, StateGraph

from app.agents.critic_agent import critic_node
from app.agents.explanation_agent import explanation_node
from app.agents.memory_agent import memory_node
from app.agents.preference_agent import preference_node
from app.agents.recommendation_agent import recommendation_node
from app.agents.state import AgentState
from app.core.logging import get_logger

logger = get_logger(__name__)


async def _clarify_node(state: AgentState) -> AgentState:
    """Terminal node when the request needs clarification."""
    question = state.get("clarifying_question") or (
        "Could you tell me a bit more about what you're in the mood for?"
    )
    state["reply"] = question
    state["final_recommendations"] = []
    return state


def _route_after_preference(state: AgentState) -> str:
    return "clarify" if state.get("needs_clarification") else "recommend"


@lru_cache(maxsize=1)
def build_recommendation_graph():  # noqa: ANN201 - compiled LangGraph type
    """Build and compile the recommendation graph (cached)."""
    graph = StateGraph(AgentState)

    graph.add_node("preference", preference_node)
    graph.add_node("clarify", _clarify_node)
    graph.add_node("recommend", recommendation_node)
    graph.add_node("critic", critic_node)
    graph.add_node("explanation", explanation_node)
    graph.add_node("memory", memory_node)

    graph.set_entry_point("preference")
    graph.add_conditional_edges(
        "preference",
        _route_after_preference,
        {"clarify": "clarify", "recommend": "recommend"},
    )
    graph.add_edge("recommend", "critic")
    graph.add_edge("critic", "explanation")
    graph.add_edge("explanation", "memory")
    graph.add_edge("memory", END)
    graph.add_edge("clarify", END)

    compiled = graph.compile()
    logger.info("recommendation_graph_compiled")
    return compiled


class RecommendationPipeline:
    """Convenience wrapper that runs the compiled graph."""

    def __init__(self) -> None:
        self._graph = build_recommendation_graph()

    async def run(self, initial_state: AgentState) -> AgentState:
        result = await self._graph.ainvoke(initial_state)
        return result  # type: ignore[return-value]
