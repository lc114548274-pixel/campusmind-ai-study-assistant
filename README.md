# CampusMind

CampusMind 是一个面向大学生的 AI 课程学习助手。它可以把课程 PDF、讲义和教材变成可检索、可问答、可总结、可练习的课程知识库，帮助学生更高效地复习和理解课程内容。

项目采用 Apple 官网式的明亮高级感设计，包含完整的多页面交互、RAG 检索增强、批量文档上传、Quiz 练习系统、用户系统和学习统计能力。

## 项目介绍

大学生学习时常常会遇到三个问题：

- 课件、教材和讲义很多，但检索困难。
- 普通 AI 不知道自己的课程内容，回答容易泛泛而谈。
- 复习缺少闭环，不能从“看资料”自然进入“总结、练习、纠错”。

CampusMind 的目标是把学生自己的课程资料转化成 AI 学习工作台：

```text
上传课程 PDF -> 解析文本 -> 切分知识片段 -> 建立向量索引
-> 基于课件问答 -> 自动总结 -> 生成 Quiz -> 作答判分 -> 学习统计
```

## 功能列表

- 用户注册、登录和 JWT 鉴权
- 课程创建、课程列表和课程详情管理
- 支持单个 PDF 上传和多 PDF 批量上传
- 自动解析 PDF 文本、切分 chunk、建立课程知识库
- 基于课程资料的 RAG 问答
- 回答中展示来源文件和页码
- 自动生成课件总结和复习清单
- 生成结构化选择题 Quiz
- 前端作答、后端自动判分、返回解析反馈
- 中 / 英 / 韩术语解释与对照
- 学习统计：课程数、文档数、题库数、练习次数、平均得分、近期活动
- 多页面交互：首页、课程库、课程详情、AI 工具台、学习洞察、登录、注册
- 支持本机开发、局域网演示和 Docker 部署

## 技术栈

| 模块 | 技术 |
|---|---|
| 前端 | Next.js 16、React 19、TypeScript、Tailwind CSS、lucide-react |
| 后端 | FastAPI、SQLAlchemy、Pydantic、Uvicorn |
| AI | Ajou / Mindlogic API Gateway，OpenAI-compatible Chat Completions |
| RAG | PDF 文本解析、chunk 切分、embedding、语义检索、关键词重排、Prompt 组装 |
| 向量索引 | ChromaDB Server，支持回退到本地 JSON 向量索引 |
| 数据库 | SQLite，支持通过 `DATABASE_URL` 切换 PostgreSQL / MySQL |
| PDF 解析 | PyMuPDF |
| 测试 | pytest、Next.js build |
| 部署 | Docker、Docker Compose |

## 系统架构

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

### RAG 问答流程

```mermaid
sequenceDiagram
  participant U as 用户
  participant Web as Next.js 前端
  participant API as FastAPI 后端
  participant RAG as RAG 服务
  participant V as 向量索引
  participant LLM as 在线 AI 模型

  U->>Web: 上传 PDF / 提问
  Web->>API: 调用课程 API
  API->>RAG: 解析问题并生成 embedding
  RAG->>V: 检索相关课件片段
  RAG->>RAG: 关键词重排 + 多文档去重
  RAG->>LLM: 拼接 Prompt 并调用模型
  LLM-->>RAG: 返回回答
  RAG-->>API: 回答 + 来源页码
  API-->>Web: 展示回答、引用和复习建议
```

### Quiz 学习闭环

```mermaid
flowchart LR
  A["课程资料"] --> B["检索考点"]
  B --> C["生成结构化 Quiz"]
  C --> D["学生作答"]
  D --> E["自动判分"]
  E --> F["解析反馈"]
  F --> G["学习统计"]
```

## 项目截图

### 首页

![CampusMind 首页](deliverables/assets/home.png)

### 课程库

![CampusMind 课程库](deliverables/assets/dashboard.png)

### 学习洞察

![CampusMind 学习洞察](deliverables/assets/insights.png)

## 运行方式

### 方式一：Windows 本地一键启动

双击项目根目录中的：

```text
start-local.bat
```

或者在 PowerShell 中运行：

```powershell
.\start-local.ps1
```

脚本会自动完成：

- 检查并创建 `.env`
- 创建后端虚拟环境
- 安装后端依赖
- 安装前端依赖
- 启动 FastAPI 后端
- 启动 Next.js 前端
- 自动打开浏览器

启动后访问：

```text
http://localhost:3000
```

API 文档：

```text
http://127.0.0.1:8000/docs
```

### 方式二：手动启动

复制环境变量：

```bash
cp .env.example .env
```

推荐配置：

```env
AI_PROVIDER=openai
EMBEDDING_PROVIDER=mock
OPENAI_BASE_URL=https://factchat-cloud.mindlogic.ai/v1/gateway
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-5-mini
NEXT_PUBLIC_API_BASE_URL=auto
```

启动后端：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

启动前端：

```powershell
cd frontend
npm install
npm run dev:host
```

打开：

```text
http://localhost:3000
```

### 方式三：Docker 启动

```bash
docker compose up --build
```

如果需要同时启动 Ollama：

```bash
docker compose --profile local-ai up --build
```

### 局域网访问

如果要让手机或另一台电脑访问，先查看当前电脑 IP：

```powershell
ipconfig
```

假设电脑 IP 是 `192.168.1.23`，在 `.env` 中设置：

```env
FRONTEND_URL=http://192.168.1.23:3000
CORS_EXTRA_ORIGINS=http://192.168.1.23:3000
NEXT_PUBLIC_API_BASE_URL=auto
```

其他设备打开：

```text
http://192.168.1.23:3000
```

## 使用流程

1. 注册或登录账号。
2. 进入课程库，创建课程。
3. 进入课程详情页。
4. 上传一份或多份 PDF。
5. 等文档状态变为“已就绪”。
6. 在问答区输入课程问题。
7. 查看 AI 回答、来源文件和页码。
8. 生成课程总结或 Quiz。
9. 完成 Quiz 作答，查看得分和解析。
10. 在学习洞察中查看整体学习状态。

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
  deliverables/
  docker-compose.yml
  start-local.bat
  start-local.ps1
```

## 未来计划

- 支持扫描版 PDF OCR
- 支持 PPTX、DOCX、图片课件解析
- 增加错题本和薄弱知识点归纳
- 增加记忆卡片和间隔复习
- 支持流式 AI 回答
- 支持学习总结、Quiz、错题本导出为 PDF / Word
- 引入后台任务队列，处理大文件解析
- 增加教师端和班级课程空间
- 增加知识图谱可视化
- 增加 GitHub Actions CI/CD 和云端部署配置

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

## License

MIT
