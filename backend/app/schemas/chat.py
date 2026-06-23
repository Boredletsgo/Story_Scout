"""Chat and recommendation-pipeline schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.book import BookRead


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None
    history: list[ChatMessage] = Field(default_factory=list)
    stream: bool = True


class RecommendationItem(BaseModel):
    book: BookRead
    score: float
    reasoning: str


class ExtractedPreferences(BaseModel):
    """Structured output of the Preference agent."""

    genre: str | None = None
    tone: str | None = None
    pacing: str | None = None
    themes: list[str] = Field(default_factory=list)
    tropes: list[str] = Field(default_factory=list)
    disliked_tropes: list[str] = Field(default_factory=list)
    reading_goals: list[str] = Field(default_factory=list)
    similar_to: list[str] = Field(default_factory=list)
    needs_clarification: bool = False
    clarifying_question: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    recommendations: list[RecommendationItem] = Field(default_factory=list)
    extracted_preferences: ExtractedPreferences | None = None
