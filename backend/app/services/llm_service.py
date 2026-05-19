import httpx

from app.core.config import settings


async def generate_text(prompt: str, system: str | None = None) -> str:
    if settings.ai_provider.lower() == "openai":
        return await _generate_openai_compatible(prompt, system)
    return await _generate_ollama(prompt, system)


async def _generate_ollama(prompt: str, system: str | None = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                json={"model": settings.ollama_chat_model, "messages": messages, "stream": False},
            )
            response.raise_for_status()
            return response.json()["message"]["content"].strip()
    except Exception:
        if settings.allow_mock_ai:
            return _fallback_answer(prompt)
        raise


async def _generate_openai_compatible(prompt: str, system: str | None = None) -> str:
    if not settings.openai_api_key:
        if settings.allow_mock_ai:
            return _fallback_answer(prompt)
        raise RuntimeError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{settings.openai_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": settings.openai_chat_model, "messages": messages, "temperature": 0.2},
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()


def _fallback_answer(prompt: str) -> str:
    return (
        "AI model is not reachable yet. The backend pipeline is working, but no live model response was "
        "returned. Start Ollama or configure an OpenAI-compatible provider in .env, then retry this action.\n\n"
        "Prompt preview:\n" + prompt[:900]
    )
