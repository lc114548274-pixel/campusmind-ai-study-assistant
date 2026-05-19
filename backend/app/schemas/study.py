from datetime import datetime

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


class QuizRead(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TermRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)
    source_language: str = "auto"
    target_language: str = "zh"


class TermResponse(BaseModel):
    content: str
