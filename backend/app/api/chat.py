from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_course
from app.db.database import get_db
from app.db.models import ChatMessage, ChatSession, User
from app.schemas.chat import ChatRequest, ChatResponse, ChatSessionRead
from app.services.rag_service import answer_question, sources_to_json

router = APIRouter()


@router.post("/courses/{course_id}/chat", response_model=ChatResponse)
async def chat(course_id: int, payload: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ChatResponse:
    get_owned_course(course_id, user, db)
    session = db.get(ChatSession, payload.session_id) if payload.session_id else None
    if session and (session.course_id != course_id or session.user_id != user.id):
        raise HTTPException(status_code=404, detail="Chat session not found")
    if not session:
        session = ChatSession(course_id=course_id, user_id=user.id, title=payload.question[:80])
        db.add(session)
        db.commit()
        db.refresh(session)
    answer, sources = await answer_question(course_id, payload.question, payload.language)
    db.add(ChatMessage(session_id=session.id, role="user", content=payload.question))
    db.add(ChatMessage(session_id=session.id, role="assistant", content=answer, sources=sources_to_json(sources)))
    db.commit()
    return ChatResponse(answer=answer, session_id=session.id, sources=sources)


@router.get("/courses/{course_id}/chat/sessions", response_model=list[ChatSessionRead])
def list_sessions(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ChatSession]:
    get_owned_course(course_id, user, db)
    return db.query(ChatSession).filter(ChatSession.course_id == course_id, ChatSession.user_id == user.id).all()


@router.get("/chat/sessions/{session_id}", response_model=ChatSessionRead)
def get_session(session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ChatSession:
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session
