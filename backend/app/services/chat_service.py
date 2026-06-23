"""Chat service: orchestrates the LangGraph pipeline + persistence + streaming."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import RecommendationPipeline
from app.agents.state import AgentState
from app.core.logging import get_logger
from app.llm import get_chat_model
from app.mlops.prompts import get_prompt
from app.mlops.tracking import Timer, log_recommendation_run, mlflow_run
from app.models.recommendation import Recommendation
from app.repositories.book import BookRepository
from app.repositories.recommendation import RecommendationRepository
from app.schemas.book import BookRead
from app.schemas.chat import ChatRequest, ChatResponse, RecommendationItem
from app.services.memory_service import MemoryService

logger = get_logger(__name__)


class ChatService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.pipeline = RecommendationPipeline()
        self.memory = MemoryService(session)
        self.books = BookRepository(session)
        self.recommendations = RecommendationRepository(session)

    async def _run_pipeline(self, user_id: int, req: ChatRequest) -> tuple[AgentState, str]:
        session_id = req.session_id or uuid.uuid4().hex
        profile = await self.memory.load_profile(user_id)
        state: AgentState = {
            "user_id": user_id,
            "message": req.message,
            "history": [m.model_dump() for m in req.history],
            "session_id": session_id,
            "user_profile": profile,
        }
        with mlflow_run("chat_recommendation", tags={"session_id": session_id}), Timer() as t:
            result: AgentState = await self.pipeline.run(state)
            log_recommendation_run(
                user_id=user_id,
                query=req.message,
                num_candidates=len(result.get("candidates", [])),
                num_final=len(result.get("final_recommendations", [])),
                total_latency_ms=t.elapsed_ms,
            )
        return result, session_id

    async def _materialize(
        self, user_id: int, session_id: str, query: str, state: AgentState
    ) -> list[RecommendationItem]:
        """Turn graph candidates into DB-backed recommendations + response items."""
        items: list[RecommendationItem] = []
        finals = state.get("final_recommendations", [])
        book_ids = [c["book_id"] for c in finals]
        books = {b.id: b for b in await self.books.get_many_by_ids(book_ids)}

        for cand in finals:
            book = books.get(cand["book_id"])
            if not book:
                continue
            await self.recommendations.add(
                Recommendation(
                    user_id=user_id,
                    book_id=book.id,
                    query=query,
                    score=cand["score"],
                    reasoning=cand["reasoning"],
                    session_id=session_id,
                )
            )
            items.append(
                RecommendationItem(
                    book=BookRead.model_validate(book),
                    score=cand["score"],
                    reasoning=cand["reasoning"],
                )
            )

        # Persist what the Memory agent learned this turn.
        if state.get("user_profile"):
            await self.memory.persist_delta(user_id, state["user_profile"])
        return items

    async def chat(self, user_id: int, req: ChatRequest) -> ChatResponse:
        """Non-streaming chat: returns the full structured response."""
        state, session_id = await self._run_pipeline(user_id, req)

        if state.get("needs_clarification"):
            return ChatResponse(
                session_id=session_id,
                message=state.get("reply")
                or "Could you tell me more about what you're looking for?",
                recommendations=[],
                extracted_preferences=state.get("preferences"),
            )

        items = await self._materialize(user_id, session_id, req.message, state)
        reply = await self._compose_reply(req.message, items)
        return ChatResponse(
            session_id=session_id,
            message=reply,
            recommendations=items,
            extracted_preferences=state.get("preferences"),
        )

    async def stream_chat(self, user_id: int, req: ChatRequest) -> AsyncIterator[str]:
        """Streaming chat: yields SSE-style tokens, then a final JSON payload.

        Tokens are plain text chunks. The final line is ``\\n[[DONE]]`` followed
        by a JSON blob with session_id and structured recommendations.
        """
        import json

        state, session_id = await self._run_pipeline(user_id, req)

        if state.get("needs_clarification"):
            question = state.get("reply") or "Could you tell me more?"
            for token in _chunk(question):
                yield token
            yield "\n[[DONE]]" + json.dumps(
                {"session_id": session_id, "recommendations": []}
            )
            return

        items = await self._materialize(user_id, session_id, req.message, state)

        # Stream the natural-language reply token-by-token from the LLM.
        async for token in self._stream_reply(req.message, items):
            yield token

        payload = {
            "session_id": session_id,
            "recommendations": [
                {
                    "book": item.book.model_dump(),
                    "score": item.score,
                    "reasoning": item.reasoning,
                }
                for item in items
            ],
        }
        yield "\n[[DONE]]" + json.dumps(payload)

    async def _compose_reply(self, message: str, items: list[RecommendationItem]) -> str:
        chunks = [t async for t in self._stream_reply(message, items)]
        return "".join(chunks).strip()

    async def _stream_reply(
        self, message: str, items: list[RecommendationItem]
    ) -> AsyncIterator[str]:
        prompt = get_prompt("chat_reply")
        rec_text = (
            "\n".join(
                f"- {i.book.title}"
                f"{' by ' + i.book.author.name if i.book.author else ''}: {i.reasoning}"
                for i in items
            )
            or "(none found)"
        )
        user_msg = prompt.template.format(message=message, recommendations=rec_text)
        model = get_chat_model(temperature=0.6, max_tokens=400)
        try:
            async for chunk in model.astream(user_msg):
                text = chunk.content if isinstance(chunk.content, str) else str(chunk.content)
                if text:
                    yield text
        except Exception as exc:  # pragma: no cover - provider dependent
            logger.warning("stream_reply_failed", error=str(exc))
            if items:
                yield "Here are a few books I think you'll love:\n"
                for i in items:
                    yield f"\n• {i.book.title} — {i.reasoning}"
            else:
                yield "I couldn't find a great match yet. Could you tell me more about your taste?"


def _chunk(text: str, size: int = 24) -> list[str]:
    return [text[i : i + size] for i in range(0, len(text), size)]
