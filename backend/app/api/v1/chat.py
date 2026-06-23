"""Chat router: conversational recommendations (streaming + non-streaming)."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.api.deps import ChatServiceDep, CurrentUser
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest, current_user: CurrentUser, service: ChatServiceDep
) -> ChatResponse:
    """Run the full agentic recommendation pipeline and return a reply."""
    return await service.chat(current_user.id, payload)


@router.post("/stream")
async def chat_stream(
    payload: ChatRequest, current_user: CurrentUser, service: ChatServiceDep
) -> StreamingResponse:
    """Stream the assistant reply token-by-token (text/plain).

    The stream ends with a line ``\\n[[DONE]]{json}`` carrying the session id
    and structured recommendations for the client to render rich cards.
    """
    generator = service.stream_chat(current_user.id, payload)
    return StreamingResponse(
        generator,
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
