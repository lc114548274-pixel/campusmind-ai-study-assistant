# 系统架构

CampusMind 是一个面向课程资料学习场景的全栈 RAG 应用。系统由 Next.js 前端、FastAPI 后端、SQL 数据库、向量索引和在线 AI 网关组成。

```mermaid
flowchart TD
  A["Next.js 前端"] -->|"HTTP API / JWT"| B["FastAPI 后端"]
  B --> C[("SQL 数据库")]
  B --> D[("ChromaDB / JSON 向量索引")]
  B --> E["PDF 文件存储"]
  B --> F["RAG 服务层"]
  F --> G["Embedding 服务"]
  F --> H["Ajou / Mindlogic 在线模型"]
  F --> I["Ollama 本地模型 可选"]
```

## 上传处理流程

```mermaid
sequenceDiagram
  participant U as 用户
  participant F as 前端
  participant B as 后端
  participant P as PDF 解析器
  participant V as 向量索引

  U->>F: 拖拽上传多份 PDF
  F->>B: multipart 批量上传
  B->>B: 保存文件和文档元数据
  B->>P: 提取每页文本
  P-->>B: 返回页面文本
  B->>B: 清洗、切分、生成 chunk
  B->>B: 生成 embedding
  B->>V: 写入向量、文本和页码来源
  B-->>F: 返回文档处理状态
```

## 问答流程

1. 用户在课程详情页提出问题。
2. 后端为问题生成 embedding。
3. 向量索引召回候选片段。
4. RAG 服务用关键词匹配进行混合重排。
5. 系统对来源做多文档去重，避免单一文件占满上下文。
6. 后端把检索结果组装为受约束的 Prompt。
7. 在线模型生成回答。
8. 回答和来源信息写入聊天记录。

## Quiz 学习闭环

```mermaid
flowchart LR
  A["课程资料"] --> B["RAG 检索考点"]
  B --> C["生成结构化 Quiz JSON"]
  C --> D["前端渲染选择题"]
  D --> E["用户作答"]
  E --> F["后端自动判分"]
  F --> G["反馈解析和平均得分"]
```

## AI 模式

- `AI_PROVIDER=openai`：使用 OpenAI 兼容的 `/chat/completions` 在线接口生成回答。
- `AI_PROVIDER=ollama`：使用 Ollama 本地模型生成回答。
- `EMBEDDING_PROVIDER=mock`：使用本地哈希 embedding，适合网关没有 embedding 接口的演示场景。
- `EMBEDDING_PROVIDER=openai`：使用在线 embedding 接口。

## 前端页面结构

```mermaid
flowchart LR
  Home["首页 /"] --> Dashboard["课程库 /dashboard"]
  Dashboard --> Course["课程详情 /courses/[id]"]
  Course --> Upload["多文档上传"]
  Course --> Chat["课件问答"]
  Course --> Quiz["Quiz 练习与判分"]
  Course --> Summary["课件总结"]
  Course --> Terms["术语解释"]
  Home --> Lab["AI 工具台 /lab"]
  Home --> Insights["学习洞察 /insights"]
```

前端采用 Apple 官网式高级感设计：明亮背景、大标题、充足留白、高对比文字、柔和卡片和轻动画。课程详情页是主要学习工作台，负责把资料上传、RAG 问答、总结、Quiz 和术语解释连接成完整学习闭环。
