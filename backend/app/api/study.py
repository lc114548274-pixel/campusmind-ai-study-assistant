from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import Course, Document, Quiz, QuizAttempt, User
from app.schemas.study import StudyStats

router = APIRouter()


@router.get("/study/stats", response_model=StudyStats)
def get_study_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> StudyStats:
    course_ids = [row[0] for row in db.query(Course.id).filter(Course.user_id == user.id).all()]
    if not course_ids:
        return StudyStats(course_count=0, document_count=0, ready_document_count=0, chunk_count=0, quiz_count=0, attempt_count=0, average_score=0, recent_activity=[])

    documents = db.query(Document).filter(Document.course_id.in_(course_ids)).all()
    quizzes = db.query(Quiz).filter(Quiz.course_id.in_(course_ids)).all()
    quiz_ids = [quiz.id for quiz in quizzes]
    attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id.in_(quiz_ids), QuizAttempt.user_id == user.id).all() if quiz_ids else []
    scored_attempts = [attempt for attempt in attempts if attempt.total > 0]
    average_score = (
        round(sum(attempt.score / attempt.total for attempt in scored_attempts) / len(scored_attempts) * 100, 1)
        if scored_attempts
        else 0
    )

    recent_documents = [
        {"type": "document", "title": document.file_name, "status": document.status, "created_at": document.created_at.isoformat()}
        for document in sorted(documents, key=lambda item: item.created_at, reverse=True)[:4]
    ]
    recent_quizzes = [
        {"type": "quiz", "title": quiz.title, "status": "generated", "created_at": quiz.created_at.isoformat()}
        for quiz in sorted(quizzes, key=lambda item: item.created_at, reverse=True)[:4]
    ]
    recent_activity = sorted([*recent_documents, *recent_quizzes], key=lambda item: item["created_at"], reverse=True)[:6]

    return StudyStats(
        course_count=len(course_ids),
        document_count=len(documents),
        ready_document_count=sum(1 for document in documents if document.status == "ready"),
        chunk_count=sum(document.chunk_count for document in documents),
        quiz_count=len(quizzes),
        attempt_count=len(attempts),
        average_score=average_score,
        recent_activity=recent_activity,
    )
