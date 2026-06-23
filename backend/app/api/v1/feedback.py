"""Feedback router: thumbs up / down."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, FeedbackServiceDep
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    payload: FeedbackCreate, current_user: CurrentUser, service: FeedbackServiceDep
) -> FeedbackRead:
    entry = await service.submit(current_user.id, payload)
    return FeedbackRead.model_validate(entry)
