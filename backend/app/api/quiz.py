from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_course
from app.db.database import get_db
from app.db.models import Quiz, User
from app.schemas.study import QuizRead, QuizRequest
from app.services.rag_service import generate_quiz_from_course

router = APIRouter()


@router.post("/courses/{course_id}/quiz", response_model=QuizRead)
async def create_quiz(course_id: int, payload: QuizRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Quiz:
    get_owned_course(course_id, user, db)
    content = await generate_quiz_from_course(course_id, payload.question_type, payload.count, payload.language)
    quiz = Quiz(course_id=course_id, title=f"{payload.question_type} x {payload.count}", content=content)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/courses/{course_id}/quiz", response_model=list[QuizRead])
def list_quizzes(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Quiz]:
    get_owned_course(course_id, user, db)
    return db.query(Quiz).filter(Quiz.course_id == course_id).order_by(Quiz.created_at.desc()).all()
