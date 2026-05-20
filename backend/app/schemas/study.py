from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SummaryRequest(BaseModel):
    language: str = "zh"
    force: bool = False


class SummaryRead(BaseModel):
    id: int
    document_id: int
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizRequest(BaseModel):
    question_type: str = "multiple_choice"
    count: int = Field(default=5, ge=1, le=20)
    language: str = "zh"
    difficulty: str = "medium"
    focus: str | None = None


class QuizRead(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizAttemptRequest(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)


class QuizAttemptRead(BaseModel):
    id: int
    quiz_id: int
    answers: str
    score: int
    total: int
    feedback: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TermRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)
    source_language: str = "auto"
    target_language: str = "zh"


class TermResponse(BaseModel):
    content: str


class StudyStats(BaseModel):
    course_count: int
    document_count: int
    ready_document_count: int
    chunk_count: int
    quiz_count: int
    attempt_count: int
    average_score: float
    recent_activity: list[dict[str, Any]]
