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
        raise RuntimeError("当 AI_PROVIDER=openai 时必须配置 OPENAI_API_KEY")
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
        "当前暂时无法连接 AI 模型。后端流程已经正常运行，但没有拿到真实模型回答。"
        "请启动 Ollama，或在 .env 中配置 OpenAI 兼容在线模型后重试。\n\n"
        "Prompt 预览：\n" + prompt[:900]
    )
