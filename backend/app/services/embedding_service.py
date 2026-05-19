import hashlib
import math

import httpx

from app.core.config import settings


def _hash_embedding(text: str, size: int = 768) -> list[float]:
    vector = [0.0] * size
    tokens = text.lower().split()
    for token in tokens or [text[:128]]:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        idx = int.from_bytes(digest[:4], "big") % size
        sign = 1 if digest[4] % 2 == 0 else -1
        vector[idx] += sign
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


async def embed_text(text: str) -> list[float]:
    if settings.embedding_provider.lower() == "openai":
        return await _embed_openai_compatible(text)
    return await _embed_ollama(text)


async def _embed_ollama(text: str) -> list[float]:
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/embeddings",
                json={"model": settings.ollama_embedding_model, "prompt": text},
            )
            response.raise_for_status()
            data = response.json()
            return data["embedding"]
    except Exception:
        if settings.allow_mock_ai:
            return _hash_embedding(text)
        raise


async def _embed_openai_compatible(text: str) -> list[float]:
    if not settings.openai_api_key:
        if settings.allow_mock_ai:
            return _hash_embedding(text)
        raise RuntimeError("当 EMBEDDING_PROVIDER=openai 时必须配置 OPENAI_API_KEY")
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{settings.openai_base_url.rstrip('/')}/embeddings",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={"model": settings.openai_embedding_model, "input": text},
            )
            response.raise_for_status()
            return response.json()["data"][0]["embedding"]
    except Exception:
        if settings.allow_mock_ai:
            return _hash_embedding(text)
        raise


async def embed_many(texts: list[str]) -> list[list[float]]:
    return [await embed_text(text) for text in texts]
