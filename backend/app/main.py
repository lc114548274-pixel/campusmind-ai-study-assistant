from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, chat, courses, documents, quiz, study, summary, terms
from app.core.config import settings
from app.db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="面向大学生课程资料的 AI 学习助手。",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(courses.router, prefix="/api/courses", tags=["课程"])
app.include_router(documents.router, prefix="/api", tags=["文档"])
app.include_router(chat.router, prefix="/api", tags=["AI 问答"])
app.include_router(summary.router, prefix="/api", tags=["总结"])
app.include_router(quiz.router, prefix="/api", tags=["复习题"])
app.include_router(terms.router, prefix="/api", tags=["术语"])
app.include_router(study.router, prefix="/api", tags=["学习闭环"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "正常", "app": settings.app_name}
