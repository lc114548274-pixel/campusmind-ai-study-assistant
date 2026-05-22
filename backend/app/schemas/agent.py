from pydantic import BaseModel, Field


class AgentTool(BaseModel):
    id: str
    name: str
    description: str
    requires_course: bool = False


class AgentRunRequest(BaseModel):
    tool: str = Field(pattern="^(ask|summary|quiz|glossary)$")
    text: str = Field(min_length=1, max_length=8000)
    language: str = "zh"
    course_id: int | None = None


class AgentRunResponse(BaseModel):
    tool: str
    content: str
