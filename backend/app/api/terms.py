from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.models import User
from app.schemas.study import TermRequest, TermResponse
from app.services.rag_service import translate_terms

router = APIRouter()


@router.post("/terms/translate", response_model=TermResponse)
async def translate(payload: TermRequest, _: User = Depends(get_current_user)) -> TermResponse:
    content = await translate_terms(payload.text, payload.source_language, payload.target_language)
    return TermResponse(content=content)
