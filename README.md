# CampusMind

CampusMind 是一个面向大学生的 AI 课程学习助手，支持上传课程 PDF、基于课件问答、自动总结重点、生成复习题，并提供中 / 英 / 韩术语解释。

项目现在采用 Apple 官网式高级感设计：明亮背景、超大标题、充足留白、高对比排版、柔和卡片、轻动画和清晰的多页面学习流程。它既可以作为可运行的课程学习系统，也适合作为 GitHub 项目主页、作品集和求职展示项目。

## 项目亮点

- 高级感 UI：明亮留白、大标题、柔和渐变、卡片布局、轻量动效和高可读文字。
- 多页面结构：首页、课程库、课程详情、AI 工具台、学习洞察、登录、注册。
- 多页面交互：课程列表 -> 课程详情 -> 上传 PDF -> AI 问答 / 总结 / 复习题。
- 创新交互：拖拽上传 PDF、模式切换、语言联动、课程进度展示。
- 个性化功能：学习洞察仪表盘、功能使用热力、今日推荐。
- AI 能力：Ajou / Mindlogic API Gateway 在线回答，RAG 课件检索增强。

## 核心功能

- 用户注册与 JWT 登录
- 课程创建、搜索与管理
- PDF 上传、解析、清洗、切分与索引
- 基于课件内容的 AI 问答
- 自动生成课件总结
- 自动生成选择题和答案解析
- 中 / 英 / 韩术语解释与对照
- 学习洞察与可视化展示
- 支持 Ajou / Mindlogic OpenAI-compatible API Gateway
- 可选支持 Ollama 本地模型

## 页面结构

| 页面 | 路由 | 说明 |
|---|---|---|
| 首页 | `/` | Apple 风格项目主页，展示产品定位、核心能力和入口 |
| 课程库 | `/dashboard` | 课程列表、搜索、创建课程、完成度展示 |
| 课程详情 | `/courses/[id]` | PDF 上传、课件问答、总结、复习题、术语解释 |
| AI 工具台 | `/lab` | 模式切换、语言联动、术语解释与学习工具 |
| 学习洞察 | `/insights` | 数据卡片、进度可视化、学习流程展示 |
| 登录 | `/login` | 用户登录 |
| 注册 | `/register` | 用户注册 |

## 技术栈

- 前端：Next.js、React、TypeScript、Tailwind CSS、lucide-react
- 后端：FastAPI、SQLAlchemy、Pydantic、Uvicorn
- AI：Ajou / Mindlogic API Gateway，OpenAI-compatible Chat Completions
- RAG：PDF 文本切分、向量检索、Prompt 拼接、来源引用
- 向量索引：ChromaDB Server，可回退为本地 JSON 向量索引
- 数据库：SQLite，支持通过 `DATABASE_URL` 切换 PostgreSQL / MySQL
- PDF 解析：PyMuPDF
- 测试：pytest、Next.js build
- 部署：Docker、Docker Compose

## 快速启动

### 1. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

推荐使用 Ajou / Mindlogic 网关：

```env
AI_PROVIDER=openai
EMBEDDING_PROVIDER=mock
OPENAI_BASE_URL=https://factchat-cloud.mindlogic.ai/v1/gateway
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-5-mini
```

说明：

- `AI_PROVIDER=openai` 表示聊天回答使用 OpenAI 兼容接口。
- `EMBEDDING_PROVIDER=mock` 表示课件检索使用本地哈希 embedding，适合没有 embedding 接口的网关。
- `OPENAI_API_KEY` 必须填写完整 API Key，不能使用带星号的隐藏 key。

### 2. 启动后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

后端地址：

```text
http://127.0.0.1:8000
```

API 文档：

```text
http://127.0.0.1:8000/docs
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端地址：

```text
http://localhost:3000
```

### 4. Docker 启动

```bash
docker compose up --build
```

如果需要同时启动 Ollama：

```bash
docker compose --profile local-ai up --build
```

## 使用流程

1. 注册或登录账号。
2. 进入课程库，创建课程。
3. 从课程列表点击课程卡片进入详情页。
4. 拖拽或选择上传 PDF。
5. 等文档状态变为“已就绪”。
6. 在问答区输入问题。
7. 根据需要生成课件总结、复习题或术语解释。
8. 进入学习洞察页查看可视化学习数据。

## RAG 工作流程

```text
用户上传 PDF
-> 后端保存文件
-> PyMuPDF 提取文本
-> 文本清洗与切分
-> 生成向量或本地哈希 embedding
-> 写入 ChromaDB / JSON 向量索引
-> 用户提问
-> 检索相关课件片段
-> 拼接 Prompt
-> 调用 Ajou / Mindlogic 在线模型
-> 返回回答与来源页码
```

## API 示例

上传 PDF：

```http
POST /api/courses/{course_id}/documents/upload
Content-Type: multipart/form-data
```

课程问答：

```http
POST /api/courses/{course_id}/chat
```

请求体：

```json
{
  "question": "用中文解释 SDN 和 OpenFlow 的区别",
  "language": "zh"
}
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
        dashboard/
        courses/
        lab/
        insights/
        login/
        register/
      components/
      lib/
  docs/
  docker-compose.yml
```

## GitHub 信息

推荐仓库名：

```text
campusmind-ai-study-assistant
```

推荐描述：

```text
面向大学生的 AI 课程学习助手，支持 PDF 问答、课件总结、复习题生成和学习洞察。
```

推荐 Topics：

```text
ai rag llm fastapi nextjs chromadb study-assistant pdf-chatbot university
```

## 验证命令

后端测试：

```bash
cd backend
python -m pytest
```

前端构建：

```bash
cd frontend
npm run build
```

## License

MIT
