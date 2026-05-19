# 系统架构

CampusMind 是一个面向课程资料学习场景的全栈 RAG 应用。

```mermaid
flowchart TD
  A[Next.js 前端] -->|HTTP API| B[FastAPI 后端]
  B --> C[(SQL 数据库)]
  B --> D[(ChromaDB Server)]
  B --> E[PDF 文件存储]
  B --> F{AI 模型提供方}
  F --> G[OpenAI 兼容在线模型]
  F --> H[Ollama 本地模型]
```

## 上传处理流程

```mermaid
sequenceDiagram
  participant U as 用户
  participant F as 前端
  participant B as 后端
  participant P as PDF解析器
  participant V as ChromaDB

  U->>F: 上传 PDF
  F->>B: 发送 multipart 文件
  B->>B: 保存文件和元数据
  B->>P: 提取每页文本
  P-->>B: 返回页面文本
  B->>B: 清洗并切分文本
  B->>B: 生成 embedding
  B->>V: 写入向量和元数据
  B-->>F: 返回文档处理完成
```

## 问答流程

1. 用户在课程页面提出问题。
2. 后端为问题生成 embedding。
3. ChromaDB 检索最相关的课件片段。
4. 后端把检索结果组装为受约束的 RAG Prompt。
5. 配置的 AI 模型生成回答。
6. 回答和来源信息写入聊天记录。

## AI 模式

- `AI_PROVIDER=openai`：使用 OpenAI 兼容的 `/chat/completions` 在线接口生成回答。
- `AI_PROVIDER=ollama`：使用 Ollama 本地模型生成回答。

Embedding 默认由 OpenAI 兼容的 `/embeddings` 在线接口生成。开发阶段如果没有配置 API Key，并且 `ALLOW_MOCK_AI=true`，系统会使用确定性备用 embedding，保证基础流程可以演示。
