from pathlib import Path
from uuid import uuid4

import fitz
from fastapi import UploadFile

from app.core.config import settings
from app.services.text_splitter import TextChunk, split_pages


async def save_upload(file: UploadFile, course_id: int) -> Path:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise ValueError("当前仅支持 PDF 文件")
    course_dir = settings.upload_dir / str(course_id)
    course_dir.mkdir(parents=True, exist_ok=True)
    safe_name = file.filename.replace("/", "_").replace("\\", "_")
    path = course_dir / f"{uuid4().hex}_{safe_name}"
    content = await file.read()
    path.write_bytes(content)
    return path


def extract_pdf(path: Path) -> tuple[int, list[tuple[int, str]]]:
    pages: list[tuple[int, str]] = []
    with fitz.open(path) as doc:
        for index, page in enumerate(doc, start=1):
            pages.append((index, page.get_text("text")))
        return doc.page_count, pages


def parse_pdf_chunks(path: Path) -> tuple[int, list[TextChunk]]:
    page_count, pages = extract_pdf(path)
    chunks = split_pages(pages, settings.chunk_size, settings.chunk_overlap)
    return page_count, chunks


def extract_preview(path: Path, limit: int = 12000) -> str:
    _, pages = extract_pdf(path)
    text = "\n\n".join(page_text for _, page_text in pages)
    return text[:limit]
