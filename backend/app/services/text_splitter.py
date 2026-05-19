import re
from dataclasses import dataclass


@dataclass(frozen=True)
class TextChunk:
    text: str
    page: int
    index: int


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_pages(pages: list[tuple[int, str]], chunk_size: int, overlap: int) -> list[TextChunk]:
    chunks: list[TextChunk] = []
    cursor = 0
    for page, raw in pages:
        text = clean_text(raw)
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            snippet = text[start:end].strip()
            if snippet:
                chunks.append(TextChunk(text=snippet, page=page, index=cursor))
                cursor += 1
            if end >= len(text):
                break
            start = max(0, end - overlap)
    return chunks
