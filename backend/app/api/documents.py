from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_course
from app.db.database import get_db
from app.db.models import Document, User
from app.schemas.document import DocumentRead
from app.services.pdf_service import parse_pdf_chunks, save_upload
from app.services.rag_service import index_document

router = APIRouter()


@router.post("/courses/{course_id}/documents/upload", response_model=DocumentRead)
async def upload_document(
    course_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Document:
    get_owned_course(course_id, user, db)
    try:
        path = await save_upload(file, course_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    document = Document(course_id=course_id, file_name=file.filename or "课件.pdf", file_path=str(path), status="processing")
    db.add(document)
    db.commit()
    db.refresh(document)
    try:
        page_count, chunks = parse_pdf_chunks(Path(document.file_path))
        chunk_count = await index_document(document, chunks)
        document.page_count = page_count
        document.chunk_count = chunk_count
        document.status = "ready"
    except Exception as exc:
        document.status = "failed"
        document.error_message = str(exc)
    db.commit()
    db.refresh(document)
    return document


@router.get("/courses/{course_id}/documents", response_model=list[DocumentRead])
def list_documents(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Document]:
    get_owned_course(course_id, user, db)
    return db.query(Document).filter(Document.course_id == course_id).order_by(Document.created_at.desc()).all()


@router.get("/documents/{document_id}", response_model=DocumentRead)
def get_document(document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Document:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    get_owned_course(document.course_id, user, db)
    return document


@router.delete("/documents/{document_id}")
def delete_document(document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, str]:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    get_owned_course(document.course_id, user, db)
    db.delete(document)
    db.commit()
    return {"status": "已删除"}
