import json
import math
import re
from pathlib import Path
from typing import Any

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


def _tokens(text: str) -> set[str]:
    normalized = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff\uac00-\ud7af]+", " ", text.lower())
    tokens = {part for part in normalized.split() if len(part) > 1}
    chinese = {normalized[idx : idx + 2] for idx in range(max(0, len(normalized) - 1)) if "\u4e00" <= normalized[idx] <= "\u9fff"}
    return tokens | chinese


def _keyword_score(question: str, text: str) -> float:
    query_tokens = _tokens(question)
    if not query_tokens:
        return 0.0
    text_tokens = _tokens(text)
    return len(query_tokens & text_tokens) / len(query_tokens)


def _cosine(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left)) or 1.0
    right_norm = math.sqrt(sum(b * b for b in right)) or 1.0
    return dot / (left_norm * right_norm)


class JsonVectorStore:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _load(self) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _save(self, rows: list[dict[str, Any]]) -> None:
        self.path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")

    def upsert(self, ids: list[str], documents: list[str], embeddings: list[list[float]], metadatas: list[dict]) -> None:
        rows = [row for row in self._load() if row["id"] not in ids]
        rows.extend(
            {"id": ids[idx], "document": documents[idx], "embedding": embeddings[idx], "metadata": metadatas[idx]}
            for idx in range(len(ids))
        )
        self._save(rows)

    def query(self, course_id: int, question: str, embedding: list[float], n_results: int) -> list[dict[str, Any]]:
        rows = [row for row in self._load() if int(row["metadata"].get("course_id", 0)) == course_id]
        scored = []
        for row in rows:
            semantic = _cosine(embedding, row["embedding"])
            lexical = _keyword_score(question, row["document"])
            scored.append((0.72 * semantic + 0.28 * lexical, row))
        return [row for _, row in sorted(scored, key=lambda item: item[0], reverse=True)[:n_results]]


fallback_store = JsonVectorStore(Path("./storage/vector_fallback.json"))


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


def _diversify_sources(sources: list[SourceChunk], limit: int) -> list[SourceChunk]:
    selected: list[SourceChunk] = []
    per_document: dict[int, int] = {}
    for source in sources:
        if per_document.get(source.document_id, 0) >= 3 and len(selected) < limit - 1:
            continue
        selected.append(source)
        per_document[source.document_id] = per_document.get(source.document_id, 0) + 1
        if len(selected) >= limit:
            break
    return selected


async def search_course(course_id: int, question: str, k: int | None = None) -> list[SourceChunk]:
    limit = k or settings.retrieval_k
    candidate_count = max(limit * 3, 12)
    embedding = await embed_text(question)
    try:
        collection = _collection(course_id)
        result = collection.query(query_embeddings=[embedding], n_results=candidate_count, include=["documents", "metadatas", "distances"])
        candidates: list[tuple[float, SourceChunk]] = []
        for idx, chunk_id in enumerate(result.get("ids", [[]])[0]):
            metadata = result.get("metadatas", [[]])[0][idx] or {}
            text = result.get("documents", [[]])[0][idx] or ""
            distance = float((result.get("distances", [[]])[0] or [0])[idx] or 0)
            semantic = 1 - min(max(distance, 0), 2) / 2
            lexical = _keyword_score(question, text)
            score = 0.72 * semantic + 0.28 * lexical
            candidates.append(
                (
                    score,
                    SourceChunk(
                        document_id=int(metadata.get("document_id", 0)),
                        document_name=str(metadata.get("document_name", "Unknown document")),
                        page=int(metadata.get("page", 0)),
                        chunk_id=chunk_id,
                        text=text,
                    ),
                )
            )
        ranked = [source for _, source in sorted(candidates, key=lambda item: item[0], reverse=True)]
        return _diversify_sources(ranked, limit)
    except Exception:
        if not settings.allow_mock_ai:
            raise
        rows = fallback_store.query(course_id, question, embedding, candidate_count)
        sources = [
            SourceChunk(
                document_id=int(row["metadata"].get("document_id", 0)),
                document_name=str(row["metadata"].get("document_name", "Unknown document")),
                page=int(row["metadata"].get("page", 0)),
                chunk_id=row["id"],
                text=row["document"],
            )
            for row in rows
        ]
        return _diversify_sources(sources, limit)


async def answer_question(course_id: int, question: str, language: str) -> tuple[str, list[SourceChunk]]:
    sources = await search_course(course_id, question)
    context = "\n\n".join(
        f"[{idx + 1}] 文件：{source.document_name}，页码：{source.page}\n{source.text}" for idx, source in enumerate(sources)
    )
    prompt = f"""
你是 CampusMind，一个面向大学生的 AI 课程学习助手。
请严格根据“课程资料上下文”回答用户问题，不要编造课件之外的事实。
如果上下文不足，请明确说明“课程资料中没有提供足够信息”，并给出下一步建议。

回答语言：{language}

课程资料上下文：
{context or "没有检索到相关课程资料。"}

用户问题：
{question}

输出要求：
1. 先给出 2-4 句直接答案。
2. 用项目符号解释关键概念和推理过程。
3. 如有来源，请用 [1]、[2] 这样的格式引用。
4. 最后给出“复习建议”或“可能考点”。
"""
    answer = await generate_text(prompt.strip())
    return answer, sources


async def summarize_document_text(text: str, language: str) -> str:
    prompt = f"""
你是一个面向考试复习的学术学习助手。请总结以下课件资料。

输出语言：{language}

课件资料：
{text}

请生成：
1. 章节摘要
2. 核心概念
3. 重要公式或定义
4. 可能考试重点
5. 5 条复习清单
6. 如有必要，生成中 / 英 / 韩术语对照表
"""
    return await generate_text(prompt.strip())


async def generate_quiz_from_course(course_id: int, question_type: str, count: int, language: str, difficulty: str = "medium", focus: str | None = None) -> str:
    query = "important exam concepts"
    if focus:
        query += f" {focus}"
    sources = await search_course(course_id, query, k=max(10, settings.retrieval_k))
    context = "\n\n".join(f"[{idx + 1}] {source.document_name} page {source.page}\n{source.text or ''}" for idx, source in enumerate(sources))
    prompt = f"""
请根据以下课程资料生成结构化复习题。

课程资料：
{context}

题型：{question_type}
题目数量：{count}
难度：{difficulty}
关注范围：{focus or "覆盖主要考点"}
输出语言：{language}

请只输出 JSON，不要输出 Markdown。JSON 格式如下：
{{
  "title": "本套题标题",
  "questions": [
    {{
      "id": "q1",
      "type": "multiple_choice",
      "question": "题干",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A",
      "explanation": "解析",
      "source": "[1]"
    }}
  ]
}}
"""
    return await generate_text(prompt.strip())


async def translate_terms(text: str, source_language: str, target_language: str) -> str:
    prompt = f"""
请从以下资料中提取并解释学术或技术术语。
源语言：{source_language}
目标语言：{target_language}

请返回 Markdown 表格，列名为：术语、韩文、英文、中文、解释、例句。

资料：
{text}
"""
    return await generate_text(prompt.strip())


def sources_to_json(sources: list[SourceChunk]) -> str:
    return json.dumps([source.model_dump() for source in sources], ensure_ascii=False)
