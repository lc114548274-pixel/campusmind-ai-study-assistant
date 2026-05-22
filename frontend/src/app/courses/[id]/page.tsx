"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  FileUp,
  Languages,
  Layers3,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  UploadCloud
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { api, ChatSource, Course, DocumentItem, Quiz, QuizAttempt, StudyStats } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; sources?: ChatSource[] };
type ParsedQuestion = { id: string; question: string; options?: string[]; answer?: string; explanation?: string; source?: string };
type ParsedQuiz = { title?: string; questions?: ParsedQuestion[] };

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    uploaded: "已上传",
    processing: "处理中",
    ready: "已就绪",
    failed: "失败"
  };
  return labels[status] || status;
}

function parseQuiz(content: string): ParsedQuiz | null {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [language, setLanguage] = useState("zh");
  const [difficulty, setDifficulty] = useState("medium");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState("");
  const [summary, setSummary] = useState("");
  const [terms, setTerms] = useState("");
  const [dragging, setDragging] = useState(false);

  const readyDocuments = useMemo(() => documents.filter((doc) => doc.status === "ready"), [documents]);
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);
  const parsedQuiz = activeQuiz ? parseQuiz(activeQuiz.content) : null;

  async function load() {
    const [courseData, docs, quizList, statsData] = await Promise.all([
      api.course(courseId),
      api.documents(courseId),
      api.quizzes(courseId),
      api.studyStats().catch(() => null)
    ]);
    setCourse(courseData);
    setDocuments(docs);
    setQuizzes(quizList);
    setStats(statsData);
    if (!activeQuiz && quizList.length > 0) setActiveQuiz(quizList[0]);
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setBusy("upload");
    try {
      if (files.length === 1) await api.uploadDocument(courseId, files[0]);
      else await api.uploadDocuments(courseId, files);
      await load();
    } finally {
      setBusy("");
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const input = formElement.elements.namedItem("files") as HTMLInputElement | null;
    await uploadFiles(Array.from(input?.files || []));
    formElement.reset();
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const question = String(new FormData(formElement).get("question") || "").trim();
    if (!question) return;
    setMessages((current) => [...current, { role: "user", content: question }]);
    formElement.reset();
    setBusy("chat");
    try {
      const response = await api.chat(courseId, { question, language, session_id: sessionId });
      setSessionId(response.session_id);
      setMessages((current) => [...current, { role: "assistant", content: response.answer, sources: response.sources }]);
    } finally {
      setBusy("");
    }
  }

  async function runSummary(documentId: number) {
    setBusy(`summary-${documentId}`);
    try {
      const response = await api.summarize(documentId, language, true);
      setSummary(response.content);
    } finally {
      setBusy("");
    }
  }

  async function runQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("quiz");
    try {
      const quiz = await api.quiz(courseId, { question_type: "multiple_choice", count: 5, language, difficulty, focus: focus || undefined });
      setActiveQuiz(quiz);
      setQuizAnswers({});
      setAttempt(null);
      await load();
    } finally {
      setBusy("");
    }
  }

  async function submitQuiz() {
    if (!activeQuiz) return;
    setBusy("attempt");
    try {
      const result = await api.submitQuiz(activeQuiz.id, quizAnswers);
      setAttempt(result);
    } finally {
      setBusy("");
    }
  }

  async function runTerms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("text") || "");
    if (!text.trim()) return;
    setBusy("terms");
    try {
      const response = await api.terms({ text, source_language: "auto", target_language: language });
      setTerms(response.content);
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <section className="mb-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="tech-panel rounded p-7">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
            <Layers3 size={16} /> 课程学习工作台
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">{course?.name || "正在加载课程..."}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{course?.description || "上传多份课件后，CampusMind 会把它们组织成可检索、可问答、可练习的课程知识库。"}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            {[
              ["文档", documents.length],
              ["可问答", readyDocuments.length],
              ["知识片段", totalChunks],
              ["平均得分", `${stats?.average_score || 0}%`]
            ].map(([label, value]) => (
              <div key={label} className="rounded bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tech-panel rounded p-5">
          <p className="mb-3 text-sm font-semibold text-slate-500">回答语言</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["zh", "中文"],
              ["en", "英文"],
              ["ko", "韩文"]
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setLanguage(value)}
                className={`rounded border px-3 py-2 text-sm font-medium transition ${
                  language === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded bg-sky-50 p-4 text-sm leading-6 text-sky-950">
            当前采用“课件检索 + 在线 AI”的 RAG 流程。系统会优先引用你上传的课程资料。
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <form
            onSubmit={upload}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setDragging(false);
              await uploadFiles(Array.from(event.dataTransfer.files || []));
            }}
            className={`tech-panel rounded p-5 transition ${dragging ? "scale-[1.01] border-sky-300 bg-sky-50" : ""}`}
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileUp size={19} /> 多文档上传
            </h2>
            <div className="mb-4 grid min-h-40 place-items-center rounded border border-dashed border-slate-300 bg-white/80 p-5 text-center">
              <UploadCloud className="mb-3 text-sky-500" size={34} />
              <p className="font-semibold">拖拽多份 PDF 到这里</p>
              <p className="mt-1 text-sm text-slate-500">系统会统一加入课程知识库。</p>
            </div>
            <input name="files" type="file" multiple accept="application/pdf" className="mb-4 block w-full rounded border border-slate-200 bg-white p-3 text-sm" />
            <button disabled={busy === "upload"} className="inline-flex w-full items-center justify-center gap-2 rounded bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60">
              {busy === "upload" && <Loader2 className="animate-spin" size={17} />} 解析并建立索引
            </button>
          </form>

          <section className="tech-panel rounded p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileSearch size={19} /> 课程文档
            </h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{doc.file_name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{statusLabel(doc.status)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{doc.page_count} 页 · {doc.chunk_count} 个知识片段</p>
                  {doc.status === "ready" && (
                    <button onClick={() => runSummary(doc.id)} className="mt-3 inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm font-medium hover:border-sky-400 hover:text-sky-600">
                      <Sparkles size={15} /> 生成总结
                    </button>
                  )}
                  {doc.error_message && <p className="mt-2 text-xs text-red-600">{doc.error_message}</p>}
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-slate-500">还没有上传 PDF。</p>}
            </div>
          </section>
        </aside>

        <section className="grid gap-6">
          <div className="tech-panel overflow-hidden rounded">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare size={19} /> 基于课件提问
              </h2>
              <span className="text-sm text-slate-500">{readyDocuments.length} 份资料已就绪</span>
            </div>
            <div className="max-h-[620px] min-h-[440px] space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && <p className="text-slate-500">上传 PDF 后即可提问。回答会引用检索到的课件片段，并给出复习建议。</p>}
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "ml-auto max-w-3xl rounded bg-slate-950 p-4 text-white" : "max-w-3xl rounded border border-slate-200 bg-white p-4"}>
                  <div className="prose-output whitespace-pre-wrap text-sm">{message.content}</div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold tracking-wide text-blue-600">来源引用</p>
                      {message.sources.map((source) => (
                        <div key={source.chunk_id} className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                          <p className="text-sm font-semibold text-slate-950">{source.document_name} · 第 {source.page} 页</p>
                          {source.text && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">“{source.text}”</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy === "chat" && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Bot size={17} /> 正在检索课件并生成回答...
                </p>
              )}
            </div>
            <form onSubmit={ask} className="flex gap-3 border-t border-slate-200 bg-white/70 p-4">
              <input name="question" placeholder="例如：这章考试重点是什么？请结合课件回答。" className="focus-ring min-w-0 flex-1 rounded border border-slate-200 px-4 py-3" />
              <button className="grid h-12 w-12 place-items-center rounded bg-sky-500 text-white transition hover:bg-slate-950" title="发送">
                <Send size={19} />
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="glass-panel rounded p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <ClipboardList size={19} /> 复习题练习系统
            </h2>
            <form onSubmit={runQuiz} className="mb-4 grid gap-3 md:grid-cols-[1fr_130px_100px]">
              <input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="关注范围，例如 ARP / SDN" className="focus-ring rounded border border-slate-200 px-3 py-2" />
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded border border-slate-200 px-3 py-2">
                <option value="easy">基础</option>
                <option value="medium">中等</option>
                <option value="hard">挑战</option>
              </select>
              <button disabled={busy === "quiz"} className="rounded bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600">出题</button>
            </form>
            {quizzes.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {quizzes.slice(0, 4).map((item) => (
                  <button key={item.id} onClick={() => { setActiveQuiz(item); setAttempt(null); setQuizAnswers({}); }} className={`rounded-full px-3 py-1 text-xs ${activeQuiz?.id === item.id ? "bg-sky-100 text-sky-700" : "bg-white text-slate-600"}`}>
                    {item.title}
                  </button>
                ))}
              </div>
            )}
            {parsedQuiz?.questions ? (
              <div className="space-y-4">
                <p className="font-semibold text-slate-950">{parsedQuiz.title || activeQuiz?.title}</p>
                {parsedQuiz.questions.map((question, index) => (
                  <div key={question.id || index} className="rounded border border-slate-200 bg-white p-4">
                    <p className="font-medium">{index + 1}. {question.question}</p>
                    <div className="mt-3 grid gap-2">
                      {(question.options || []).map((option) => (
                        <label key={option} className="flex cursor-pointer items-center gap-2 rounded border border-slate-100 px-3 py-2 text-sm hover:bg-sky-50">
                          <input type="radio" name={question.id} value={option[0]} checked={quizAnswers[question.id] === option[0]} onChange={() => setQuizAnswers((current) => ({ ...current, [question.id]: option[0] }))} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={submitQuiz} disabled={busy === "attempt"} className="rounded bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-slate-950">提交并判分</button>
                {attempt && (
                  <div className="rounded bg-green-50 p-4 text-sm text-green-900">
                    <p className="mb-2 flex items-center gap-2 font-semibold"><CheckCircle2 size={17} /> 得分：{attempt.score} / {attempt.total}</p>
                    <p className="whitespace-pre-wrap">{attempt.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose-output max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
                {activeQuiz?.content || "生成一套题后，这里会显示可作答的选择题。"}
              </div>
            )}
          </section>

          <section className="glass-panel rounded p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Languages size={19} /> 术语解释
            </h2>
            <form onSubmit={runTerms} className="space-y-3">
              <textarea name="text" rows={4} placeholder="粘贴术语或一段课件内容，例如：ARP, routing table, OpenFlow..." className="focus-ring w-full resize-none rounded border border-slate-200 px-3 py-3" />
              <button disabled={busy === "terms"} className="rounded bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-sky-600">解释术语</button>
            </form>
            <div className="prose-output mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">{terms}</div>
          </section>

          {summary && (
            <section className="glass-panel rounded p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Target size={19} /> 课件总结与复习清单
              </h2>
              <div className="prose-output whitespace-pre-wrap text-sm text-slate-700">{summary}</div>
            </section>
          )}
        </aside>
      </div>
    </Shell>
  );
}
