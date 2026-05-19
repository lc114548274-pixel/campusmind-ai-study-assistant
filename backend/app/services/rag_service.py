import json
import math
from pathlib import Path

import chromadb

from app.core.config import settings
from app.db.models import Document
from app.schemas.document import SourceChunk
from app.services.embedding_service import embed_many, embed_text
from app.services.llm_service import generate_text
from app.services.text_splitter import TextChunk

_client = None


def _client_instance():
    global _client
    if _client is None:
        _client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port, ssl=settings.chroma_ssl)
    return _client


def _collection_name(course_id: int) -> str:
    return f"{settings.chroma_collection_prefix}_{course_id}"


def _collection(course_id: int):
    return _client_instance().get_or_create_collection(name=_collection_name(course_id), metadata={"hnsw:space": "cosine"})


class JsonVectorStore:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _load(self) -> list[dict]:
        if not self.path.exists():
            return []
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _save(self, rows: list[dict]) -> None:
        self.path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")

    def upsert(self, ids: list[str], documents: list[str], embeddings: list[list[float]], metadatas: list[dict]) -> None:
        rows = [row for row in self._load() if row["id"] not in ids]
        rows.extend(
            {"id": ids[idx], "document": documents[idx], "embedding": embeddings[idx], "metadata": metadatas[idx]}
            for idx in range(len(ids))
        )
        self._save(rows)

    def query(self, course_id: int, embedding: list[float], n_results: int) -> list[dict]:
        rows = [row for row in self._load() if int(row["metadata"].get("course_id", 0)) == course_id]
        scored = sorted(rows, key=lambda row: _cosine(embedding, row["embedding"]), reverse=True)
        return scored[:n_results]


fallback_store = JsonVectorStore(Path("./storage/vector_fallback.json"))


def _cosine(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left)) or 1.0
    right_norm = math.sqrt(sum(b * b for b in right)) or 1.0
    return dot / (left_norm * right_norm)


async def index_document(document: Document, chunks: list[TextChunk]) -> int:
    if not chunks:
        return 0
    ids = [f"doc-{document.id}-chunk-{chunk.index}" for chunk in chunks]
    metadatas = [
        {
            "course_id": document.course_id,
            "document_id": document.id,
            "document_name": document.file_name,
            "page": chunk.page,
            "chunk_index": chunk.index,
        }
        for chunk in chunks
    ]
    documents = [chunk.text for chunk in chunks]
    embeddings = await embed_many(documents)
    try:
        collection = _collection(document.course_id)
        collection.upsert(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)
    except Exception:
        if not settings.allow_mock_ai:
            raise
        fallback_store.upsert(ids, documents, embeddings, metadatas)
    return len(chunks)


async def search_course(course_id: int, question: str, k: int | None = None) -> list[SourceChunk]:
    embedding = await embed_text(question)
    try:
        collection = _collection(course_id)
        result = collection.query(query_embeddings=[embedding], n_results=k or settings.retrieval_k)
    except Exception:
        if not settings.allow_mock_ai:
            raise
        rows = fallback_store.query(course_id, embedding, k or settings.retrieval_k)
        return [
            SourceChunk(
                document_id=int(row["metadata"].get("document_id", 0)),
                document_name=str(row["metadata"].get("document_name", "Unknown document")),
                page=int(row["metadata"].get("page", 0)),
                chunk_id=row["id"],
                text=row["document"],
            )
            for row in rows
        ]
    sources: list[SourceChunk] = []
    for idx, chunk_id in enumerate(result.get("ids", [[]])[0]):
        metadata = result.get("metadatas", [[]])[0][idx] or {}
        text = result.get("documents", [[]])[0][idx]
        sources.append(
            SourceChunk(
                document_id=int(metadata.get("document_id", 0)),
                document_name=str(metadata.get("document_name", "Unknown document")),
                page=int(metadata.get("page", 0)),
                chunk_id=chunk_id,
                text=text,
            )
        )
    return sources


async def answer_question(course_id: int, question: str, language: str) -> tuple[str, list[SourceChunk]]:
    sources = await search_course(course_id, question)
    context = "\n\n".join(
        f"[{idx + 1}] {source.document_name}, page {source.page}\n{source.text}" for idx, source in enumerate(sources)
    )
    prompt = f"""
You are CampusMind, an AI study assistant for university students.
Answer the user's question based only on the provided course materials.
If the answer cannot be found in the context, say the course material does not provide enough information.

Context:
{context or "No retrieved context."}

User question:
{question}

Answer language:
{language}

Requirements:
1. Be accurate and concise.
2. Explain difficult terms clearly.
3. Do not invent facts outside the provided context.
4. Include source references like [1], [2] when available.
"""
    answer = await generate_text(prompt.strip())
    return answer, sources


async def summarize_document_text(text: str, language: str) -> str:
    prompt = f"""
You are an academic study assistant. Summarize this lecture material for exam preparation.

Material:
{text}

Generate:
1. Chapter summary
2. Key concepts
3. Important formulas or definitions
4. Possible exam points
5. Short review checklist
6. English/Korean/Chinese terminology table when useful

Language: {language}
"""
    return await generate_text(prompt.strip())


async def generate_quiz_from_course(course_id: int, question_type: str, count: int, language: str) -> str:
    sources = await search_course(course_id, f"important exam concepts {question_type}", k=max(8, settings.retrieval_k))
    context = "\n\n".join(source.text or "" for source in sources)
    prompt = f"""
Generate study questions based on the following course material.

Material:
{context}

Question type: {question_type}
Number of questions: {count}
Language: {language}

For each question, provide:
1. Question
2. Options if multiple choice
3. Correct answer
4. Explanation
Keep the result well structured in Markdown.
"""
    return await generate_text(prompt.strip())


async def translate_terms(text: str, source_language: str, target_language: str) -> str:
    prompt = f"""
Extract and explain academic or technical terms from this material.
Source language: {source_language}
Target language: {target_language}

Return a Markdown table with columns:
Term, Korean, English, Chinese, Explanation, Example.

Material:
{text}
"""
    return await generate_text(prompt.strip())


def sources_to_json(sources: list[SourceChunk]) -> str:
    return json.dumps([source.model_dump() for source in sources], ensure_ascii=False)
