"""Feedback schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.feedback import FeedbackType


class FeedbackCreate(BaseModel):
    book_id: int
    feedback_type: FeedbackType
    reason: str | None = None


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_id: int
    feedback_type: FeedbackType
    reason: str | None = None
