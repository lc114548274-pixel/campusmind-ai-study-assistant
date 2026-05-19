const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "deliverables");
const assetDir = path.join(outDir, "assets");
fs.mkdirSync(outDir, { recursive: true });

const pptxPath = path.join(outDir, "CampusMind项目发布演讲PPT.pptx");
const docxPath = path.join(outDir, "CampusMind项目发布说明与演讲稿.docx");
let pptx;

const colors = {
  ink: "111827",
  muted: "667085",
  faint: "F5F7FB",
  line: "D8DEE9",
  blue: "0071E3",
  cyan: "5AC8FA",
  green: "34C759",
  orange: "FF9F0A",
  purple: "AF52DE",
  white: "FFFFFF",
};

function addBg(slide) {
  slide.background = { color: "FBFCFF" };
  slide.addShape(pptx.ShapeType.arc, {
    x: 9.25,
    y: -1.2,
    w: 4.6,
    h: 4.6,
    line: { color: "EAF5FF", transparency: 100 },
    fill: { color: "EAF5FF", transparency: 12 },
    adjustPoint: 0.15,
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: -1.2,
    y: 5.2,
    w: 4.2,
    h: 4.2,
    line: { color: "F7ECFF", transparency: 100 },
    fill: { color: "F7ECFF", transparency: 16 },
    adjustPoint: 0.2,
  });
}

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    fontFace: opts.fontFace || "Microsoft YaHei UI",
    fontSize: opts.size || 18,
    bold: opts.bold || false,
    color: opts.color || colors.ink,
    align: opts.align || "left",
    valign: opts.valign || "top",
    paraSpaceAfterPt: 0,
    breakLine: false,
  });
}

function kicker(slide, value, x = 0.68, y = 0.45) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 1.7,
    h: 0.34,
    rectRadius: 0.08,
    line: { color: "DCEBFF", transparency: 10 },
    fill: { color: "EEF6FF" },
  });
  text(slide, value, x + 0.16, y + 0.075, 1.35, 0.18, {
    size: 7.8,
    bold: true,
    color: colors.blue,
    align: "center",
    valign: "mid",
  });
}

function title(slide, value, subtitle, opts = {}) {
  kicker(slide, opts.kicker || "CAMPUSMIND");
  text(slide, value, 0.68, 0.94, 10.4, opts.titleH || 0.88, {
    size: opts.size || 29,
    bold: true,
    color: colors.ink,
  });
  if (subtitle) {
    text(slide, subtitle, 0.72, opts.subY || 1.88, 8.8, opts.subH || 0.5, {
      size: opts.subSize || 12.8,
      color: colors.muted,
    });
  }
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: opts.radius || 0.16,
    line: { color: opts.line || "E4E9F2", transparency: opts.lineT ?? 0, width: 1 },
    fill: { color: opts.fill || colors.white, transparency: opts.transparency || 0 },
    shadow: opts.shadow === false ? undefined : { type: "outer", color: "D6DEEA", opacity: 0.18, blur: 1.5, angle: 45, distance: 1 },
  });
}

function metric(slide, x, y, n, label, accent) {
  card(slide, x, y, 2.55, 1.25);
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.18,
    y: y + 0.2,
    w: 0.34,
    h: 0.34,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  text(slide, n, x + 0.23, y + 0.48, 1.8, 0.28, { size: 23, bold: true });
  text(slide, label, x + 0.23, y + 0.84, 1.95, 0.22, { size: 8.4, color: colors.muted });
}

function bullets(slide, items, x, y, w, opts = {}) {
  items.forEach((item, idx) => {
    const yy = y + idx * (opts.gap || 0.5);
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: yy + 0.05,
      w: 0.08,
      h: 0.08,
      line: { color: opts.accent || colors.blue, transparency: 100 },
      fill: { color: opts.accent || colors.blue },
    });
    text(slide, item, x + 0.18, yy, w, 0.26, { size: opts.size || 12, color: opts.color || colors.ink });
  });
}

function screenshot(slide, filename, x, y, w, h) {
  const p = path.join(assetDir, filename);
  if (fs.existsSync(p)) {
    slide.addImage({ path: p, x, y, w, h, sizingCrop: true });
  } else {
    card(slide, x, y, w, h, { fill: "F7F9FC" });
    text(slide, "产品界面截图", x + 0.3, y + 0.3, w - 0.6, 0.3, { size: 14, bold: true, color: colors.muted });
  }
}

async function main() {
pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "CampusMind";
pptx.company = "CampusMind";
pptx.subject = "AI 课程学习助手项目发布";
pptx.title = "CampusMind 项目发布演讲";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Microsoft YaHei UI",
  bodyFontFace: "Microsoft YaHei UI",
  lang: "zh-CN",
};
pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });

let slide = pptx.addSlide();
addBg(slide);
text(slide, "CampusMind", 0.72, 0.72, 5, 0.55, { size: 18, bold: true, color: colors.blue });
text(slide, "让课件变成你的\nAI 学习搭子", 0.72, 1.55, 6.7, 1.65, { size: 35, bold: true });
text(slide, "面向大学生的 AI 课程学习助手：上传 PDF，自动解析课程知识，支持课件问答、重点总结、复习题生成和中英韩术语解释。", 0.78, 3.46, 5.9, 0.78, { size: 13, color: colors.muted });
metric(slide, 0.82, 5.25, "5", "核心学习功能", colors.blue);
metric(slide, 3.65, 5.25, "7+", "完整页面与流程", colors.green);
metric(slide, 6.48, 5.25, "RAG", "基于课件回答", colors.purple);
card(slide, 8.4, 1.0, 3.95, 5.55, { fill: "F7FAFF" });
screenshot(slide, "home.png", 8.62, 1.22, 3.5, 2.12);
screenshot(slide, "dashboard.png", 8.88, 3.58, 2.96, 1.8);
text(slide, "项目发布演讲", 9.0, 6.05, 2.6, 0.25, { size: 10, color: colors.muted, align: "center" });

slide = pptx.addSlide();
addBg(slide);
title(slide, "大学生最缺的不是资料，而是把资料变成知识的系统。", "课程 PDF、讲义、教材很多，但复习时真正需要的是：能定位重点、能回答问题、能生成练习、能解释术语。", { kicker: "WHY" });
const pain = [
  ["资料分散", "PDF、课件、笔记散落在不同位置，很难检索。"],
  ["复习低效", "临考前重新翻课件，重点和知识关系不清晰。"],
  ["问答不准", "普通聊天模型没有课件上下文，容易泛泛而谈。"],
  ["语言障碍", "中 / 英 / 韩术语转换频繁，理解成本高。"],
];
pain.forEach((p, i) => {
  const x = 0.78 + (i % 2) * 5.75;
  const y = 2.72 + Math.floor(i / 2) * 1.45;
  card(slide, x, y, 5.15, 1.08);
  text(slide, `0${i + 1}`, x + 0.28, y + 0.22, 0.5, 0.22, { size: 11, bold: true, color: colors.blue });
  text(slide, p[0], x + 0.9, y + 0.2, 1.5, 0.26, { size: 15, bold: true });
  text(slide, p[1], x + 0.9, y + 0.58, 3.75, 0.26, { size: 9.8, color: colors.muted });
});

slide = pptx.addSlide();
addBg(slide);
title(slide, "CampusMind 的定位：本地课程知识库 + 在线 AI 推理。", "目标不是做一个普通聊天机器人，而是把学生自己的课件变成可检索、可问答、可复习的课程知识库。", { kicker: "POSITIONING" });
card(slide, 0.75, 2.55, 3.55, 3.55, { fill: "FFFFFF" });
card(slide, 4.9, 2.55, 3.55, 3.55, { fill: "FFFFFF" });
card(slide, 9.05, 2.55, 3.55, 3.55, { fill: "FFFFFF" });
text(slide, "学生资料", 1.12, 2.95, 2.3, 0.3, { size: 16, bold: true });
bullets(slide, ["课程 PDF", "教材 / 讲义", "多语言术语"], 1.15, 3.58, 2.3, { gap: 0.5 });
text(slide, "RAG 检索", 5.27, 2.95, 2.3, 0.3, { size: 16, bold: true });
bullets(slide, ["解析文本", "切分片段", "按问题检索"], 5.3, 3.58, 2.3, { gap: 0.5, accent: colors.purple });
text(slide, "AI 输出", 9.42, 2.95, 2.3, 0.3, { size: 16, bold: true });
bullets(slide, ["问答", "总结", "复习题"], 9.45, 3.58, 2.3, { gap: 0.5, accent: colors.green });
slide.addShape(pptx.ShapeType.chevron, { x: 4.38, y: 3.72, w: 0.35, h: 0.42, line: { color: colors.blue, transparency: 100 }, fill: { color: colors.blue } });
slide.addShape(pptx.ShapeType.chevron, { x: 8.53, y: 3.72, w: 0.35, h: 0.42, line: { color: colors.blue, transparency: 100 }, fill: { color: colors.blue } });

slide = pptx.addSlide();
addBg(slide);
title(slide, "MVP 主链路已经闭环：上传 PDF 到 AI 回答。", "第一版聚焦最核心的学习闭环，保证可以真实使用、真实演示、真实扩展。", { kicker: "CORE FLOW" });
const steps = [
  ["上传 PDF", "学生上传课程课件"],
  ["解析文本", "PyMuPDF 提取页文本"],
  ["切分索引", "文本块写入向量索引"],
  ["用户提问", "检索相关课件片段"],
  ["AI 回答", "带来源页码输出"],
];
steps.forEach((s, i) => {
  const x = 0.72 + i * 2.45;
  card(slide, x, 3.05, 1.98, 1.55, { fill: i === 4 ? "EEF6FF" : "FFFFFF" });
  text(slide, `${i + 1}`, x + 0.22, 3.28, 0.32, 0.28, { size: 16, bold: true, color: colors.blue });
  text(slide, s[0], x + 0.22, 3.72, 1.28, 0.25, { size: 13, bold: true });
  text(slide, s[1], x + 0.22, 4.1, 1.42, 0.26, { size: 8.4, color: colors.muted });
  if (i < steps.length - 1) {
    slide.addShape(pptx.ShapeType.line, { x: x + 2.05, y: 3.83, w: 0.38, h: 0, line: { color: "B8C7D9", width: 1.2, beginArrowType: "none", endArrowType: "triangle" } });
  }
});
text(slide, "这条链路是项目的主干：后续总结、复习题、术语解释，都是围绕已解析课件继续生长。", 1.0, 5.65, 10.8, 0.35, { size: 13, color: colors.muted, align: "center" });

slide = pptx.addSlide();
addBg(slide);
title(slide, "页面结构不只是好看，而是围绕学习路径组织。", "项目包含 4 个以上完整页面，并实现列表到详情、选择到功能执行的真实跳转。", { kicker: "PAGES" });
card(slide, 0.7, 2.05, 3.55, 3.95, { fill: "F8FBFF" });
screenshot(slide, "dashboard.png", 0.9, 2.25, 3.15, 1.75);
text(slide, "课程库", 1.0, 4.3, 1.4, 0.3, { size: 15, bold: true });
text(slide, "搜索课程、创建课程、查看学习进度，并进入课程详情。", 1.0, 4.75, 2.6, 0.5, { size: 9.2, color: colors.muted });
card(slide, 4.9, 2.05, 3.55, 3.95, { fill: "FFFFFF" });
screenshot(slide, "home.png", 5.1, 2.25, 3.15, 1.75);
text(slide, "首页", 5.2, 4.3, 1.4, 0.3, { size: 15, bold: true });
text(slide, "展示产品定位、核心能力、技术亮点和主入口。", 5.2, 4.75, 2.6, 0.5, { size: 9.2, color: colors.muted });
card(slide, 9.1, 2.05, 3.55, 3.95, { fill: "FFFFFF" });
screenshot(slide, "insights.png", 9.3, 2.25, 3.15, 1.75);
text(slide, "学习洞察", 9.4, 4.3, 1.4, 0.3, { size: 15, bold: true });
text(slide, "用数据可视化呈现课程完成度、学习建议和能力变化。", 9.4, 4.75, 2.6, 0.5, { size: 9.2, color: colors.muted });

slide = pptx.addSlide();
addBg(slide);
title(slide, "系统架构：Next.js 前端 + FastAPI 后端 + RAG 服务层。", "架构保持清晰可部署：前端负责交互，后端负责业务与 AI 编排，向量索引负责课件检索。", { kicker: "ARCHITECTURE" });
const nodes = [
  ["Next.js 前端", 0.95, 3.0, colors.blue],
  ["FastAPI 后端", 3.95, 3.0, colors.green],
  ["数据库", 6.9, 2.25, colors.orange],
  ["向量索引", 6.9, 3.72, colors.purple],
  ["在线 AI 网关", 9.95, 3.0, colors.blue],
];
nodes.forEach(([n, x, y, c]) => {
  card(slide, x, y, 2.25, 0.82, { fill: "FFFFFF" });
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.22, y: y + 0.25, w: 0.17, h: 0.17, line: { color: c, transparency: 100 }, fill: { color: c } });
  text(slide, n, x + 0.52, y + 0.25, 1.38, 0.2, { size: 11, bold: true });
});
[[3.22, 3.42, 0.63], [6.22, 3.42, 0.54], [9.2, 3.42, 0.65]].forEach(([x, y, w]) => {
  slide.addShape(pptx.ShapeType.line, { x, y, w, h: 0, line: { color: "9BAAC0", width: 1.4, endArrowType: "triangle" } });
});
text(slide, "HTTP API", 3.28, 3.12, 0.8, 0.18, { size: 7.4, color: colors.muted });
text(slide, "RAG 编排", 6.18, 3.12, 0.8, 0.18, { size: 7.4, color: colors.muted });
text(slide, "Chat Completions", 8.55, 3.12, 1.2, 0.18, { size: 7.4, color: colors.muted });
bullets(slide, ["认证：JWT", "PDF 解析：PyMuPDF", "模型：Ajou / Mindlogic OpenAI-compatible Gateway", "部署：Docker Compose"], 1.05, 5.55, 8.8, { gap: 0.32, size: 9.8 });

slide = pptx.addSlide();
addBg(slide);
title(slide, "AI 不是直接聊天，而是先找课件证据再回答。", "这样可以显著降低幻觉风险，并让回答尽量基于学生自己的课程资料。", { kicker: "RAG" });
card(slide, 0.8, 2.55, 5.1, 3.3, { fill: "FFFFFF" });
text(slide, "Prompt 约束", 1.15, 2.92, 2.0, 0.26, { size: 16, bold: true });
bullets(slide, ["只根据课件资料回答", "找不到答案时明确说明", "返回来源页码与片段", "支持中文、英文、韩文输出"], 1.18, 3.55, 3.8, { gap: 0.43, size: 10.5 });
card(slide, 6.45, 2.55, 5.9, 3.3, { fill: "F8FBFF" });
text(slide, "在线模型配置", 6.8, 2.92, 2.2, 0.26, { size: 16, bold: true });
text(slide, "AI_PROVIDER=openai\nOPENAI_BASE_URL=https://factchat-cloud.mindlogic.ai/v1/gateway\nOPENAI_CHAT_MODEL=gpt-5-mini\nEMBEDDING_PROVIDER=mock", 6.82, 3.55, 4.95, 1.12, { size: 10.6, color: colors.ink, fontFace: "Consolas" });
text(slide, "当前项目已支持在线 AI 回答，embedding 可使用在线服务，也可用本地哈希方案完成演示闭环。", 6.82, 5.12, 4.6, 0.34, { size: 9.2, color: colors.muted });

slide = pptx.addSlide();
addBg(slide);
title(slide, "设计方向：从炫技科技风，升级为更稳的 Apple 官网式高级感。", "这套视觉更适合上台展示、GitHub 项目主页、作品集和求职作品：清晰、克制、可信。", { kicker: "DESIGN" });
metric(slide, 0.85, 2.72, "01", "超大标题与强层级", colors.blue);
metric(slide, 3.75, 2.72, "02", "大量留白与轻卡片", colors.green);
metric(slide, 6.65, 2.72, "03", "柔和动效与渐变", colors.purple);
metric(slide, 9.55, 2.72, "04", "高对比可读文字", colors.orange);
card(slide, 1.3, 4.78, 10.7, 1.0, { fill: "111827" });
text(slide, "视觉原则：先保证信息清楚，再用细腻的光感、留白和动效制造高级感。", 1.75, 5.12, 9.8, 0.26, { size: 15, bold: true, color: colors.white, align: "center" });

slide = pptx.addSlide();
addBg(slide);
title(slide, "现场演示按 5 步走，观众最容易理解。", "不要先讲代码，先让大家看到一个学生如何真正使用它学习。", { kicker: "DEMO" });
const demo = [
  ["注册 / 登录", "创建自己的课程空间"],
  ["新建课程", "例如：计算机网络"],
  ["上传 PDF", "系统解析并建立索引"],
  ["基于课件提问", "问 ARP、SDN、OpenFlow 等"],
  ["生成复习材料", "总结重点、出题、翻译术语"],
];
demo.forEach((d, i) => {
  const y = 2.1 + i * 0.82;
  slide.addShape(pptx.ShapeType.ellipse, { x: 1.0, y: y + 0.03, w: 0.34, h: 0.34, line: { color: colors.blue, transparency: 100 }, fill: { color: i === 2 ? colors.blue : "DCEBFF" } });
  text(slide, `${i + 1}`, 1.1, y + 0.105, 0.12, 0.12, { size: 7.4, bold: true, color: i === 2 ? colors.white : colors.blue, align: "center" });
  text(slide, d[0], 1.6, y, 2.0, 0.25, { size: 13, bold: true });
  text(slide, d[1], 3.6, y + 0.03, 5.5, 0.22, { size: 10.3, color: colors.muted });
});
card(slide, 9.45, 2.25, 2.8, 3.25, { fill: "F8FBFF" });
text(slide, "演示重点", 9.8, 2.62, 1.5, 0.25, { size: 15, bold: true });
bullets(slide, ["证明能跑", "证明能问", "证明能扩展"], 9.82, 3.25, 1.8, { gap: 0.46, size: 10.8, accent: colors.green });

slide = pptx.addSlide();
addBg(slide);
title(slide, "技术选型以“能落地、能扩展、能部署”为标准。", "项目不是只做页面，而是前后端、AI、RAG、数据库、Docker 都形成了完整工程链路。", { kicker: "STACK" });
const stack = [
  ["前端", "Next.js / React / TypeScript / Tailwind"],
  ["后端", "FastAPI / SQLAlchemy / Pydantic / Uvicorn"],
  ["AI", "Ajou Gateway / OpenAI-compatible API"],
  ["RAG", "PDF Parse / Chunking / Vector Search / Prompt"],
  ["数据", "SQLite / PostgreSQL / MySQL 可切换"],
  ["部署", "Docker / Docker Compose"],
];
stack.forEach((s, i) => {
  const x = 0.9 + (i % 3) * 4.1;
  const y = 2.48 + Math.floor(i / 3) * 1.35;
  card(slide, x, y, 3.45, 0.92);
  text(slide, s[0], x + 0.28, y + 0.25, 0.75, 0.18, { size: 11, bold: true, color: colors.blue });
  text(slide, s[1], x + 1.02, y + 0.25, 2.0, 0.22, { size: 9.4, color: colors.ink });
});

slide = pptx.addSlide();
addBg(slide);
title(slide, "项目价值：把 AI 从“能聊天”推进到“能辅助学习”。", "CampusMind 的优势不是模型本身，而是把模型放进课程学习场景里，形成一个可重复使用的知识工作流。", { kicker: "VALUE" });
card(slide, 0.9, 2.55, 3.35, 3.25, { fill: "FFFFFF" });
card(slide, 4.95, 2.55, 3.35, 3.25, { fill: "FFFFFF" });
card(slide, 9.0, 2.55, 3.35, 3.25, { fill: "FFFFFF" });
text(slide, "对学生", 1.25, 2.95, 1.3, 0.26, { size: 16, bold: true });
bullets(slide, ["更快复习", "按课件回答", "跨语言理解"], 1.28, 3.58, 2.0, { gap: 0.46 });
text(slide, "对课程", 5.3, 2.95, 1.3, 0.26, { size: 16, bold: true });
bullets(slide, ["知识可检索", "资料结构化", "沉淀课程库"], 5.33, 3.58, 2.0, { gap: 0.46, accent: colors.purple });
text(slide, "对项目", 9.35, 2.95, 1.3, 0.26, { size: 16, bold: true });
bullets(slide, ["完整全栈", "可部署", "可继续扩展"], 9.38, 3.58, 2.0, { gap: 0.46, accent: colors.green });

slide = pptx.addSlide();
addBg(slide);
title(slide, "下一步：从 MVP 走向真正的校园学习平台。", "现阶段主流程已打通，后续重点是增强学习效果、多人协作和生产部署能力。", { kicker: "ROADMAP" });
const road = [
  ["短期", "OCR 扫描 PDF、流式回答、导出总结和题库"],
  ["中期", "错题本、记忆卡片、知识图谱、课程推荐"],
  ["长期", "多用户课程空间、教师端、云端部署、权限体系"],
];
road.forEach((r, i) => {
  const x = 1.0 + i * 4.05;
  card(slide, x, 2.75, 3.25, 2.35, { fill: i === 0 ? "EEF6FF" : "FFFFFF" });
  text(slide, r[0], x + 0.32, 3.14, 1.0, 0.27, { size: 16, bold: true, color: colors.blue });
  text(slide, r[1], x + 0.32, 3.72, 2.35, 0.8, { size: 11, color: colors.muted });
});
text(slide, "谢谢大家", 0.9, 6.22, 4.0, 0.45, { size: 24, bold: true });
text(slide, "欢迎体验 CampusMind，也欢迎提出问题。", 0.95, 6.72, 6.5, 0.25, { size: 11.5, color: colors.muted });

await pptx.writeFile({ fileName: pptxPath });

function p(textValue, opts = {}) {
  return new Paragraph({
    text: textValue,
    heading: opts.heading,
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before || 0, after: opts.after || 160, line: 300 },
    children: opts.children,
    border: opts.border,
    shading: opts.shading,
  });
}

function run(textValue, opts = {}) {
  return new TextRun({
    text: textValue,
    bold: opts.bold || false,
    italics: opts.italics || false,
    color: opts.color || colors.ink,
    size: opts.size || 22,
    font: "Microsoft YaHei UI",
  });
}

function sectionTitle(value) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [run(value, { bold: true, size: 34, color: colors.ink })],
  });
}

function subTitle(value) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [run(value, { bold: true, size: 26, color: colors.blue })],
  });
}

function bullet(value) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 90, line: 280 },
    children: [run(value, { size: 21, color: colors.ink })],
  });
}

function table(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D8DEE9" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D8DEE9" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "D8DEE9" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "D8DEE9" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5EAF2" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5EAF2" },
    },
    rows: rows.map((row, idx) =>
      new TableRow({
        tableHeader: idx === 0,
        children: row.map((cell) =>
          new TableCell({
            margins: { top: 130, bottom: 130, left: 150, right: 150 },
            shading: idx === 0 ? { type: ShadingType.CLEAR, fill: "EEF6FF" } : undefined,
            children: [new Paragraph({ children: [run(cell, { bold: idx === 0, size: 20, color: idx === 0 ? colors.blue : colors.ink })] })],
          })
        ),
      })
    ),
  });
}

const doc = new Document({
  creator: "CampusMind",
  title: "CampusMind 项目发布说明与演讲稿",
  description: "CampusMind 上台演讲材料",
  styles: {
    default: {
      document: { run: { font: "Microsoft YaHei UI", size: 22, color: colors.ink } },
    },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 44, bold: true, color: colors.ink, font: "Microsoft YaHei UI" },
        paragraph: { spacing: { after: 240 } },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [run("CampusMind 项目发布说明与演讲稿", { bold: true, size: 42 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [run("面向大学生的 AI 课程学习助手", { size: 24, color: colors.muted })],
        }),
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: "EEF6FF" },
          spacing: { before: 120, after: 260, line: 320 },
          children: [
            run("一句话介绍：", { bold: true, color: colors.blue }),
            run("CampusMind 把学生自己的课程 PDF 变成可检索、可问答、可总结、可出题的 AI 学习知识库。", { size: 22 }),
          ],
        }),
        sectionTitle("一、项目概述"),
        p("CampusMind 是一个面向大学生课程学习场景的全栈 AI 应用。用户可以创建课程、上传课程 PDF，系统会解析文本、切分内容并建立索引。之后，用户可以围绕课件提问，系统会先检索相关课件片段，再调用在线 AI 模型生成回答。"),
        p("项目的重点不是展示一个普通聊天机器人，而是展示一个完整的课程学习工作流：资料进入系统、知识被结构化、问题被检索增强、学习结果被总结和练习化。"),
        subTitle("核心功能"),
        bullet("上传课程 PDF，并自动解析文本。"),
        bullet("基于课件内容进行 AI 问答，尽量避免脱离资料的泛泛回答。"),
        bullet("自动生成课程重点总结和复习题。"),
        bullet("支持中 / 英 / 韩术语解释，适合多语言学习环境。"),
        bullet("提供课程库、课程详情、AI 工具台、学习洞察等完整页面。"),
        sectionTitle("二、演讲结构建议"),
        table([
          ["环节", "建议时长", "讲述重点"],
          ["开场", "30 秒", "说明 CampusMind 解决大学生课件学习效率低的问题。"],
          ["痛点", "1 分钟", "资料分散、复习低效、普通 AI 缺少课件上下文。"],
          ["产品", "2 分钟", "展示课程库、PDF 上传、问答、总结、复习题、术语解释。"],
          ["技术", "2 分钟", "解释 Next.js + FastAPI + RAG + 在线模型网关。"],
          ["演示", "3 分钟", "注册登录、创建课程、上传 PDF、提问、生成复习材料。"],
          ["总结", "1 分钟", "强调项目已形成可运行闭环，并说明后续规划。"],
        ]),
        sectionTitle("三、完整演讲稿"),
        subTitle("1. 开场"),
        p("大家好，我今天发布的项目叫 CampusMind，它是一个面向大学生的 AI 课程学习助手。它的目标不是再做一个泛用聊天机器人，而是把学生自己的课件、讲义和教材 PDF 变成一个可以检索、可以提问、可以总结、可以生成练习题的课程知识库。"),
        subTitle("2. 问题背景"),
        p("在大学学习中，学生拥有很多资料：PDF 课件、教材、课堂笔记和复习资料。但真正复习的时候，常常会遇到三个问题。第一，资料很多却不容易检索；第二，重点不清楚，需要一页一页翻；第三，直接问普通 AI 时，它不知道我的课件内容，回答可能很泛，也可能不符合老师讲的范围。"),
        subTitle("3. 产品方案"),
        p("CampusMind 的方案是让 AI 先理解并检索课程资料，再回答问题。用户创建一门课程后，可以上传 PDF。后端会解析每一页文本，把文本切分成小片段并建立索引。用户提问时，系统先找出最相关的课件片段，再把这些片段和问题一起交给在线 AI 模型，从而得到更贴近课件的回答。"),
        subTitle("4. 核心功能"),
        p("第一，PDF 上传与解析；第二，基于课件的 AI 问答；第三，自动总结重点；第四，生成复习题和选择题；第五，中英韩术语解释。这些功能共同服务于一个学习目标：让课程资料从静态文件变成可交互的知识助手。"),
        subTitle("5. 技术实现"),
        p("技术上，前端使用 Next.js、React、TypeScript 和 Tailwind CSS，整体采用 Apple 官网式的明亮高级感设计。后端使用 FastAPI，负责用户、课程、文档、问答和 AI 编排。AI 部分通过 Ajou / Mindlogic 的 OpenAI 兼容网关调用在线模型。RAG 部分负责 PDF 文本切分、向量检索和 Prompt 拼接。数据库默认使用 SQLite，也可以通过环境变量切换到 PostgreSQL 或 MySQL。"),
        subTitle("6. 演示引导"),
        p("接下来我会演示完整流程：先注册或登录账号，然后创建一门课程，例如“计算机网络”。进入课程详情后上传一份 PDF 课件，系统解析完成后，我可以直接问课件中的问题，比如 ARP 是什么、SDN 和 OpenFlow 有什么区别。最后我会展示总结、复习题和术语解释功能。"),
        subTitle("7. 总结"),
        p("CampusMind 当前已经完成从 PDF 上传到 AI 回答的核心闭环，也完成了多页面产品结构和在线模型接入。后续可以继续扩展 OCR、错题本、记忆卡片、知识图谱、教师端和云端部署。我的目标是让它从一个课程 AI 助手，逐步发展成一个真正可用的校园学习平台。谢谢大家。"),
        sectionTitle("四、现场演示步骤"),
        table([
          ["步骤", "操作", "讲解词"],
          ["1", "打开首页", "这是 CampusMind 的产品入口，展示项目定位和核心能力。"],
          ["2", "注册 / 登录", "每个学生拥有自己的课程知识库。"],
          ["3", "创建课程", "以计算机网络为例，创建课程空间。"],
          ["4", "上传 PDF", "系统开始解析课件文本并建立可检索索引。"],
          ["5", "提问", "AI 根据检索到的课件片段回答，而不是凭空回答。"],
          ["6", "生成材料", "展示总结、复习题、术语解释，说明学习闭环。"],
        ]),
        sectionTitle("五、技术答辩要点"),
        subTitle("为什么使用 RAG？"),
        p("因为普通大模型并不知道用户上传的课件。RAG 可以先检索相关课件片段，再把片段作为上下文提供给模型，从而让回答更贴近课程资料，也更容易标注来源。"),
        subTitle("为什么选择 FastAPI？"),
        p("FastAPI 适合快速构建 AI 后端服务，异步支持好，接口文档自动生成，和 Python 生态中的 PDF 解析、向量检索、AI SDK 配合自然。"),
        subTitle("为什么可以使用在线 AI？"),
        p("本项目原本支持本地 Ollama，也支持 OpenAI-compatible 在线接口。在线模型推理能力更强，演示更稳定；本地模型则适合隐私要求高或离线部署的场景。"),
        subTitle("项目如何部署？"),
        p("项目提供 Docker Compose，可以统一启动前端、后端、数据库和向量服务。生产环境可以把 SQLite 替换为 PostgreSQL，把本地文件存储替换为对象存储。"),
        sectionTitle("六、未来规划"),
        bullet("加入 OCR，支持扫描版 PDF 和图片课件。"),
        bullet("加入流式回答，让 AI 输出更自然。"),
        bullet("加入错题本、记忆卡片和间隔复习。"),
        bullet("加入知识图谱，把课程概念之间的关系可视化。"),
        bullet("加入教师端和班级空间，支持课程资料统一管理。"),
        bullet("完善生产部署、安全策略和权限管理。"),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(JSON.stringify({ pptxPath, docxPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
