from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_course
from app.db.database import get_db
from app.db.models import User
from app.schemas.agent import AgentRunRequest, AgentRunResponse, AgentTool
from app.services.llm_service import generate_text
from app.services.rag_service import answer_question, generate_quiz_from_course, summarize_document_text, translate_terms

router = APIRouter()

TOOLS = [
    AgentTool(id="ask", name="Ask AI", description="将问题交给课程 RAG 问答工具，支持来源引用。", requires_course=True),
    AgentTool(id="summary", name="Summary", description="把课件片段或学习材料整理成重点总结和复习清单。"),
    AgentTool(id="quiz", name="Quiz", description="根据课程资料或输入文本生成结构化练习题。"),
    AgentTool(id="glossary", name="Glossary", description="提取中英韩术语解释表。"),
]


@router.get("/agent/tools", response_model=list[AgentTool])
def list_agent_tools() -> list[AgentTool]:
    return TOOLS


@router.post("/agent/run", response_model=AgentRunResponse)
async def run_agent_tool(
    payload: AgentRunRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AgentRunResponse:
    if payload.course_id:
        get_owned_course(payload.course_id, user, db)

    if payload.tool == "ask" and payload.course_id:
        answer, _ = await answer_question(payload.course_id, payload.text, payload.language)
        return AgentRunResponse(tool=payload.tool, content=answer)

    if payload.tool == "summary":
        content = await summarize_document_text(payload.text, payload.language)
        return AgentRunResponse(tool=payload.tool, content=content)

    if payload.tool == "quiz" and payload.course_id:
        content = await generate_quiz_from_course(payload.course_id, "multiple_choice", 5, payload.language, "medium", payload.text)
        return AgentRunResponse(tool=payload.tool, content=content)

    if payload.tool == "glossary":
        content = await translate_terms(payload.text, "auto", payload.language)
        return AgentRunResponse(tool=payload.tool, content=content)

    fallback_prompt = f"""
你是 CampusMind 的学习工具 Agent。
工具模式：{payload.tool}
输出语言：{payload.language}

请根据用户输入完成对应学习任务：
{payload.text}

如果是 Ask AI，请把问题整理成适合课程 RAG 检索的提问建议。
如果是 Quiz，请生成 5 道选择题，包含选项、答案和解析。
"""
    content = await generate_text(fallback_prompt.strip())
    return AgentRunResponse(tool=payload.tool, content=content)
