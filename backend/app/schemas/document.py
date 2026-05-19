from datetime import datetime

from pydantic import BaseModel


class DocumentRead(BaseModel):
    id: int
    course_id: int
    file_name: str
    status: str
    page_count: int
    chunk_count: int
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SourceChunk(BaseModel):
    document_id: int
    document_name: str
    page: int
    chunk_id: str
    text: str | None = None
