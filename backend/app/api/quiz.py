import json
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_course
from app.db.database import get_db
from app.db.models import Quiz, QuizAttempt, User
from app.schemas.study import QuizAttemptRead, QuizAttemptRequest, QuizRead, QuizRequest
from app.services.rag_service import generate_quiz_from_course

router = APIRouter()


def _extract_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.S)
        if match:
            return json.loads(match.group(0))
        raise


def _score_quiz(content: str, answers: dict[str, str]) -> tuple[int, int, str]:
    try:
        data = _extract_json(content)
    except Exception:
        return 0, 0, "当前题目不是结构化 JSON，无法自动判分，但仍可作为复习材料使用。"

    questions = data.get("questions", [])
    score = 0
    feedback: list[str] = []
    for question in questions:
        qid = str(question.get("id", ""))
        expected = str(question.get("answer", "")).strip().upper()
        actual = str(answers.get(qid, "")).strip().upper()
        ok = bool(expected and actual and actual.startswith(expected[:1]))
        score += 1 if ok else 0
        feedback.append(f"{qid or '题目'}：{'正确' if ok else '需要复习'}。{question.get('explanation', '')}")
    return score, len(questions), "\n".join(feedback)


@router.post("/courses/{course_id}/quiz", response_model=QuizRead)
async def create_quiz(course_id: int, payload: QuizRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Quiz:
    get_owned_course(course_id, user, db)
    content = await generate_quiz_from_course(course_id, payload.question_type, payload.count, payload.language, payload.difficulty, payload.focus)
    title = f"{payload.focus or '课程复习'} · {payload.count} 题 · {payload.difficulty}"
    quiz = Quiz(course_id=course_id, title=title, content=content)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/courses/{course_id}/quiz", response_model=list[QuizRead])
def list_quizzes(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Quiz]:
    get_owned_course(course_id, user, db)
    return db.query(Quiz).filter(Quiz.course_id == course_id).order_by(Quiz.created_at.desc()).all()


@router.post("/quiz/{quiz_id}/attempts", response_model=QuizAttemptRead)
def submit_quiz_attempt(quiz_id: int, payload: QuizAttemptRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> QuizAttempt:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="复习题不存在")
    get_owned_course(quiz.course_id, user, db)
    score, total, feedback = _score_quiz(quiz.content, payload.answers)
    attempt = QuizAttempt(quiz_id=quiz.id, user_id=user.id, answers=json.dumps(payload.answers, ensure_ascii=False), score=score, total=total, feedback=feedback)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


@router.get("/quiz/{quiz_id}/attempts", response_model=list[QuizAttemptRead])
def list_quiz_attempts(quiz_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[QuizAttempt]:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="复习题不存在")
    get_owned_course(quiz.course_id, user, db)
    return db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user.id).order_by(QuizAttempt.created_at.desc()).all()
