# Architecture

CampusMind is a full-stack RAG application for course-based study workflows.

```mermaid
flowchart TD
  A[Next.js Frontend] -->|HTTP API| B[FastAPI Backend]
  B --> C[(SQL Database)]
  B --> D[(ChromaDB Server)]
  B --> E[PDF File Store]
  B --> F{AI Provider}
  F --> G[Ollama Local Models]
  F --> H[OpenAI-Compatible Online Models]
```

## Upload Pipeline

```mermaid
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant B as Backend
  participant P as PDF Parser
  participant V as ChromaDB

  U->>F: Upload PDF
  F->>B: POST multipart file
  B->>B: Save file metadata
  B->>P: Extract page text
  P-->>B: Page text
  B->>B: Clean and chunk text
  B->>B: Generate embeddings
  B->>V: Upsert vectors and metadata
  B-->>F: Document ready
```

## Question Answering Pipeline

1. User asks a course-specific question.
2. Backend embeds the question.
3. ChromaDB retrieves the most relevant chunks.
4. Backend builds a grounded prompt with retrieved context.
5. The configured AI model generates the answer.
6. The answer is saved to chat history with source metadata.

## AI Provider Modes

- `AI_PROVIDER=ollama`: local-first generation through Ollama.
- `AI_PROVIDER=openai`: online generation through an OpenAI-compatible `/chat/completions` endpoint.

Embeddings are generated through Ollama. During development, `ALLOW_MOCK_AI=true` enables deterministic fallback embeddings when Ollama is unavailable.
