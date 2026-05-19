from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_course
from app.db.database import get_db
from app.db.models import Course, User
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate

router = APIRouter()


def _read(course: Course) -> CourseRead:
    data = CourseRead.model_validate(course).model_dump()
    data["document_count"] = len(course.documents)
    return CourseRead(**data)


@router.get("", response_model=list[CourseRead])
def list_courses(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[CourseRead]:
    courses = db.query(Course).filter(Course.user_id == user.id).order_by(Course.created_at.desc()).all()
    return [_read(course) for course in courses]


@router.post("", response_model=CourseRead)
def create_course(payload: CourseCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CourseRead:
    course = Course(user_id=user.id, name=payload.name, description=payload.description)
    db.add(course)
    db.commit()
    db.refresh(course)
    return _read(course)


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CourseRead:
    return _read(get_owned_course(course_id, user, db))


@router.put("/{course_id}", response_model=CourseRead)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseRead:
    course = get_owned_course(course_id, user, db)
    if payload.name is not None:
        course.name = payload.name
    if payload.description is not None:
        course.description = payload.description
    db.commit()
    db.refresh(course)
    return _read(course)


@router.delete("/{course_id}")
def delete_course(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    course = get_owned_course(course_id, user, db)
    db.delete(course)
    db.commit()
    return {"status": "deleted"}
