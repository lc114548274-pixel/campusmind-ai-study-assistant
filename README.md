# CampusMind

A local or online AI-powered study assistant for university students, supporting PDF Q&A, lecture summarization, quiz generation, and multilingual terminology learning.

CampusMind turns course PDFs into a searchable course knowledge base. Students can upload lecture material, ask grounded questions, generate exam-focused summaries, create review questions, and translate technical terms between Chinese, English, and Korean.

## Features

- User registration and JWT login
- Course management
- PDF upload, parsing, cleaning, chunking, and indexing
- ChromaDB vector search through Chroma Server
- RAG-based course Q&A with source references
- Lecture summaries for exam preparation
- Multiple-choice quiz generation
- Chinese / English / Korean terminology support
- Ollama local model support
- OpenAI-compatible online model support
- Dockerized frontend and backend

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, lucide-react
- Backend: FastAPI, SQLAlchemy, Pydantic
- AI: Ollama or OpenAI-compatible online models
- Vector database: ChromaDB
- Database: SQLite by default, PostgreSQL/MySQL-ready through `DATABASE_URL`
- PDF processing: PyMuPDF
- Deployment: Docker Compose

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
```

For local AI:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

For an online OpenAI-compatible model:

```env
AI_PROVIDER=openai
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-4o-mini
```

Embeddings currently use Ollama embeddings first. If Ollama is not reachable and `ALLOW_MOCK_AI=true`, the backend uses a deterministic fallback embedding so development workflows still run. Chroma runs as a server to avoid Windows native build issues with local HNSW dependencies. If Docker/Chroma is not available during local development, the backend falls back to a small JSON vector index so the MVP workflow can still be demonstrated.

### 2. Start backend

Start Chroma first:

```bash
docker compose up -d chroma
```

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

### 4. Docker

```bash
docker compose up --build
```

To also start Ollama through Docker:

```bash
docker compose --profile local-ai up --build
```

Pull models if using local Ollama:

```bash
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

## Core Workflow

1. Register or log in.
2. Create a course, for example `Computer Networks`.
3. Upload a PDF lecture file.
4. The backend extracts text, splits it into chunks, embeds each chunk, and stores it in ChromaDB Server.
5. Ask a question from the course page.
6. CampusMind retrieves relevant chunks, sends them to the configured model, and returns an answer with document/page references.

## API Examples

```http
POST /api/courses/{course_id}/documents/upload
Content-Type: multipart/form-data
```

```json
{
  "question": "用中文解释 SDN 和 OpenFlow 的区别",
  "language": "zh"
}
```

```http
POST /api/courses/{course_id}/chat
```

## Repository Name

Recommended GitHub repository name:

```text
campusmind-ai-study-assistant
```

Recommended description:

```text
A local AI-powered study assistant for university students, supporting PDF Q&A, lecture summarization, and quiz generation.
```

Suggested topics:

```text
ai rag llm ollama fastapi nextjs chromadb study-assistant pdf-chatbot university
```

## Project Structure

```text
campusmind-ai-study-assistant/
  backend/
    app/
      api/
      core/
      db/
      schemas/
      services/
      tests/
  frontend/
    src/
      app/
      components/
      lib/
  docs/
  docker-compose.yml
```

## License

MIT
