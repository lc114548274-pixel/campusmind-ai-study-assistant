from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_course
from app.db.database import get_db
from app.db.models import Document, Summary, User
from app.schemas.study import SummaryRead, SummaryRequest
from app.services.pdf_service import extract_preview
from app.services.rag_service import summarize_document_text

router = APIRouter()


@router.post("/documents/{document_id}/summary", response_model=SummaryRead)
async def create_summary(
    document_id: int,
    payload: SummaryRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Summary:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    get_owned_course(document.course_id, user, db)
    if document.summary and not payload.force:
        return document.summary
    content = await summarize_document_text(extract_preview(Path(document.file_path)), payload.language)
    summary = document.summary or Summary(document_id=document.id, content=content)
    summary.content = content
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.get("/documents/{document_id}/summary", response_model=SummaryRead)
def get_summary(document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Summary:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    get_owned_course(document.course_id, user, db)
    if not document.summary:
        raise HTTPException(status_code=404, detail="总结不存在")
    return document.summary
