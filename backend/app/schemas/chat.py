from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.document import SourceChunk


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=4000)
    language: str = "zh"
    session_id: int | None = None


class ChatResponse(BaseModel):
    answer: str
    session_id: int
    sources: list[SourceChunk]


class ChatMessageRead(BaseModel):
    id: int
    role: str
    content: str
    sources: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionRead(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: list[ChatMessageRead] = []

    model_config = {"from_attributes": True}
