# CampusMind

CampusMind 是一个面向大学生的 AI 课程学习助手，支持上传课程 PDF、基于课件问答、自动总结重点、生成复习题，并提供中 / 英 / 韩术语解释。

它的目标不是做一个普通聊天机器人，而是把学生自己的课件、讲义和教材 PDF 变成可检索的课程知识库，让 AI 尽量基于真实资料回答问题。

## 核心功能

- 用户注册与 JWT 登录
- 课程创建与管理
- PDF 上传、解析、清洗、切分与索引
- 通过 ChromaDB Server 进行向量检索
- 基于 RAG 的课件问答，并返回来源引用
- 面向考试复习的课件总结
- 自动生成选择题和答案解析
- 中 / 英 / 韩术语解释与对照
- 支持 Ollama 本地模型
- 支持 OpenAI 兼容的在线模型
- 前后端 Docker 化部署

## 技术栈

- 前端：Next.js、React、TypeScript、Tailwind CSS、lucide-react
- 后端：FastAPI、SQLAlchemy、Pydantic
- AI：Ollama 本地模型或 OpenAI 兼容在线模型
- 向量数据库：ChromaDB
- 数据库：默认 SQLite，可通过 `DATABASE_URL` 切换 PostgreSQL / MySQL
- PDF 解析：PyMuPDF
- 部署：Docker Compose

## 快速启动

### 1. 配置环境变量

```bash
cp .env.example .env
```

使用本地 Ollama：

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

使用在线 OpenAI 兼容模型：

```env
AI_PROVIDER=openai
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-4o-mini
```

Embedding 默认优先使用 Ollama。如果 Ollama 不可用，并且 `ALLOW_MOCK_AI=true`，后端会启用确定性的备用 embedding，方便本地开发演示。Chroma 以服务模式运行，避免 Windows 本地 HNSW 原生依赖编译问题。如果本地没有 Docker 或 Chroma，后端会自动退回到一个轻量 JSON 向量索引，让 MVP 流程仍然可以跑通。

### 2. 启动后端

如果安装了 Docker，建议先启动 Chroma：

```bash
docker compose up -d chroma
```

然后启动后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问地址：

- 前端：http://localhost:3000
- 后端 API 文档：http://localhost:8000/docs

### 4. Docker 一键启动

```bash
docker compose up --build
```

如果希望同时启动 Ollama：

```bash
docker compose --profile local-ai up --build
```

使用本地 Ollama 时，先拉取模型：

```bash
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

## 使用流程

1. 注册或登录账号。
2. 创建课程，例如“计算机网络”。
3. 上传课程 PDF。
4. 后端提取文本、切分 chunk、生成 embedding，并写入 ChromaDB Server 或本地备用向量索引。
5. 在课程页面提问。
6. CampusMind 检索相关课件片段，把上下文交给模型，并返回带来源页码的回答。

## API 示例

上传 PDF：

```http
POST /api/courses/{course_id}/documents/upload
Content-Type: multipart/form-data
```

课程问答请求：

```json
{
  "question": "用中文解释 SDN 和 OpenFlow 的区别",
  "language": "zh"
}
```

```http
POST /api/courses/{course_id}/chat
```

## GitHub 仓库信息

推荐仓库名：

```text
campusmind-ai-study-assistant
```

推荐描述：

```text
面向大学生的 AI 课程学习助手，支持 PDF 问答、课件总结和复习题生成。
```

推荐 Topics：

```text
ai rag llm ollama fastapi nextjs chromadb study-assistant pdf-chatbot university
```

## 项目结构

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

## 许可证

MIT
