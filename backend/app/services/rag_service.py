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
你是 CampusMind，一个面向大学生的 AI 课程学习助手。
请只根据提供的课程资料回答用户问题。
如果上下文中找不到答案，请明确说明“课程资料中没有提供足够信息”。

课程资料上下文：
{context or "没有检索到相关课程资料。"}

用户问题：
{question}

回答语言：
{language}

要求：
1. 准确、清晰、简洁。
2. 对难懂术语进行解释。
3. 不要编造课程资料以外的事实。
4. 如果有来源，请使用 [1]、[2] 这样的引用标记。
"""
    answer = await generate_text(prompt.strip())
    return answer, sources


async def summarize_document_text(text: str, language: str) -> str:
    prompt = f"""
你是一个面向考试复习的学术学习助手。请总结以下课件资料。

课件资料：
{text}

请生成：
1. 章节摘要
2. 核心概念
3. 重要公式或定义
4. 可能考试重点
5. 简短复习清单
6. 如有必要，生成英文 / 韩文 / 中文术语对照表

输出语言：{language}
"""
    return await generate_text(prompt.strip())


async def generate_quiz_from_course(course_id: int, question_type: str, count: int, language: str) -> str:
    sources = await search_course(course_id, f"important exam concepts {question_type}", k=max(8, settings.retrieval_k))
    context = "\n\n".join(source.text or "" for source in sources)
    prompt = f"""
请根据以下课程资料生成复习题。

课程资料：
{context}

题型：{question_type}
题目数量：{count}
输出语言：{language}

每道题请包含：
1. 题目
2. 如果是选择题，请提供选项
3. 正确答案
4. 解析
请使用结构清晰的 Markdown 输出。
"""
    return await generate_text(prompt.strip())


async def translate_terms(text: str, source_language: str, target_language: str) -> str:
    prompt = f"""
请从以下资料中提取并解释学术或技术术语。
源语言：{source_language}
目标语言：{target_language}

请返回 Markdown 表格，列名为：
术语、韩文、英文、中文、解释、例句。

资料：
{text}
"""
    return await generate_text(prompt.strip())


def sources_to_json(sources: list[SourceChunk]) -> str:
    return json.dumps([source.model_dump() for source in sources], ensure_ascii=False)
