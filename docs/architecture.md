# 系统架构

CampusMind 是一个面向课程资料学习场景的全栈 RAG 应用。系统由 Next.js 前端、FastAPI 后端、SQL 数据库、向量索引、RAG 服务层、Agent 工具层和在线 AI 网关组成。

```mermaid
flowchart TD
  A["Next.js 前端"] -->|"HTTP API / JWT"| B["FastAPI 后端"]
  B --> C[("SQL 数据库")]
  B --> D[("ChromaDB / JSON 向量索引")]
  B --> E["PDF 文件存储"]
  B --> F["RAG 服务层"]
  B --> J["Agent 工具层"]
  J --> F
  J --> K["Summary / Quiz / Glossary 服务"]
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

## RAG 问答流程

1. 用户在课程详情页提出问题。
2. 后端为问题生成 embedding。
3. 向量索引召回候选片段。
4. RAG 服务用关键词匹配进行混合重排。
5. 系统对来源做多文档去重，避免单一文件占满上下文。
6. 后端把检索结果组装为受约束的 Prompt。
7. 在线模型生成回答。
8. 回答和来源信息写入聊天记录。
9. 前端展示答案、文件名、页码和原文片段。

当前 RAG 属于“实战可用的基础增强版”：已经超过最简单的“向量检索 + Prompt 拼接”，因为加入了多文档、页码来源、关键词重排、引用展示和降级索引；但还不是高级企业级 RAG，未来可以继续加入查询改写、reranker 模型、评测集、流式响应和后台任务队列。

## Agent 工具层

本项目参考 CSU-CampusMind 的工具调用思路，增加轻量 Agent 工具层，把分散的 AI 能力统一暴露给前端。

```mermaid
flowchart LR
  Web["AI 工具台 /lab"] --> Agent["/api/agent/run"]
  Agent --> Ask["Ask AI"]
  Agent --> Summary["Summary"]
  Agent --> Quiz["Quiz"]
  Agent --> Glossary["Glossary"]
  Ask --> RAG["课程 RAG"]
  Summary --> LLM["在线模型"]
  Quiz --> LLM
  Glossary --> LLM
```

接口：

```text
GET  /api/agent/tools
POST /api/agent/run
```

优势：

- 前端可以用统一协议调用不同 AI 能力。
- 后端可以继续增加工具，而不用重写页面结构。
- 后续可以平滑升级到流式输出、工具选择、课程内多轮任务和更复杂的 Agent workflow。

## Quiz 学习闭环

```mermaid
flowchart LR
  A["课程资料"] --> B["RAG 检索考点"]
  B --> C["生成结构化 Quiz JSON"]
  C --> D["前端渲染选择题"]
  D --> E["用户作答"]
  E --> F["后端自动判分"]
  F --> G["反馈解析和平均得分"]
  G --> H["学习洞察"]
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

前端采用苹果官网式高级感设计：明亮背景、大标题、充足留白、高对比文字、柔和卡片和轻动画。课程详情页是主要学习工作台，负责把资料上传、RAG 问答、总结、Quiz 和术语解释连接成完整学习闭环。
