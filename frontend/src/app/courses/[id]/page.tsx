"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  Bot,
  ClipboardList,
  FileSearch,
  FileUp,
  Languages,
  Loader2,
  MessageSquare,
  NotebookTabs,
  Send,
  Sparkles,
  UploadCloud
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { api, ChatSource, Course, DocumentItem } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; sources?: ChatSource[] };

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    uploaded: "已上传",
    processing: "处理中",
    ready: "已就绪",
    failed: "失败"
  };
  return labels[status] || status;
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [language, setLanguage] = useState("zh");
  const [busy, setBusy] = useState("");
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState("");
  const [terms, setTerms] = useState("");
  const [dragging, setDragging] = useState(false);

  const readyDocuments = useMemo(() => documents.filter((doc) => doc.status === "ready"), [documents]);
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);

  async function load() {
    const [courseData, docs] = await Promise.all([api.course(courseId), api.documents(courseId)]);
    setCourse(courseData);
    setDocuments(docs);
  }

  async function uploadFile(file: File) {
    setBusy("upload");
    await api.uploadDocument(courseId, file);
    await load();
    setBusy("");
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const file = (new FormData(formElement).get("file") as File) || null;
    if (!file || file.size === 0) return;
    await uploadFile(file);
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
    const response = await api.chat(courseId, { question, language, session_id: sessionId });
    setSessionId(response.session_id);
    setMessages((current) => [...current, { role: "assistant", content: response.answer, sources: response.sources }]);
    setBusy("");
  }

  async function runSummary(documentId: number) {
    setBusy(`summary-${documentId}`);
    const response = await api.summarize(documentId, language, true);
    setSummary(response.content);
    setBusy("");
  }

  async function runQuiz() {
    setBusy("quiz");
    const response = await api.quiz(courseId, { question_type: "multiple_choice", count: 5, language });
    setQuiz(response.content);
    setBusy("");
  }

  async function runTerms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("text") || "");
    if (!text.trim()) return;
    setBusy("terms");
    const response = await api.terms({ text, source_language: "auto", target_language: language });
    setTerms(response.content);
    setBusy("");
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="tech-panel rounded p-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">课程详情</p>
          <h1 className="text-5xl font-semibold leading-tight text-slate-950">{course?.name || "正在加载..."}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">{course?.description || "上传课件资料后即可构建这门课的知识库。"}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded bg-white p-4">
              <p className="text-sm text-slate-500">文档</p>
              <p className="mt-1 text-2xl font-semibold">{documents.length}</p>
            </div>
            <div className="rounded bg-white p-4">
              <p className="text-sm text-slate-500">知识片段</p>
              <p className="mt-1 text-2xl font-semibold">{totalChunks}</p>
            </div>
            <div className="rounded bg-white p-4">
              <p className="text-sm text-slate-500">可问答资料</p>
              <p className="mt-1 text-2xl font-semibold">{readyDocuments.length}</p>
            </div>
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
                  language === value ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600 hover:border-mint hover:text-mint"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded bg-teal-50 p-4 text-sm leading-6 text-teal-900">
            当前聊天使用 Ajou / Mindlogic 在线模型，课件检索使用本地向量兜底。
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <aside className="space-y-5">
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
              const file = event.dataTransfer.files?.[0];
              if (file) await uploadFile(file);
            }}
            className={`tech-panel rounded p-5 transition ${dragging ? "scale-[1.01] border-cyan-400 bg-cyan-50/80" : ""}`}
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileUp size={19} /> 上传 PDF
            </h2>
            <div className="mb-4 grid min-h-40 place-items-center rounded border border-dashed border-slate-300 bg-white/70 p-5 text-center">
              <UploadCloud className="mb-3 text-mint" size={34} />
              <p className="font-semibold">拖拽 PDF 到这里</p>
              <p className="mt-1 text-sm text-slate-500">或点击下方按钮选择文件</p>
            </div>
            <input name="file" type="file" accept="application/pdf" className="mb-4 block w-full rounded border border-slate-200 bg-white p-3 text-sm" />
            <button disabled={busy === "upload"} className="inline-flex w-full items-center justify-center gap-2 rounded bg-mint px-4 py-3 font-semibold text-white transition hover:bg-ink disabled:opacity-60">
              {busy === "upload" && <Loader2 className="animate-spin" size={17} />} 解析 PDF
            </button>
          </form>

          <section className="tech-panel rounded p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <NotebookTabs size={19} /> 课程文档
            </h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{doc.file_name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{statusLabel(doc.status)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{doc.page_count} 页 · {doc.chunk_count} 个片段</p>
                  {doc.status === "ready" && (
                    <button onClick={() => runSummary(doc.id)} className="mt-3 inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm font-medium hover:border-coral hover:text-coral">
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
              <span className="text-sm text-slate-500">{readyDocuments.length} 个文档已就绪</span>
            </div>
            <div className="max-h-[440px] min-h-[280px] space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && <p className="text-slate-500">上传 PDF 后即可提问。回答会引用检索到的课件片段。</p>}
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "ml-auto max-w-3xl rounded bg-ink p-4 text-white" : "max-w-3xl rounded border border-slate-200 bg-white p-4"}>
                  <div className="prose-output text-sm">{message.content}</div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <span key={source.chunk_id} className="rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-800">
                          {source.document_name} 第 {source.page} 页
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy === "chat" && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Bot size={17} /> 正在思考...
                </p>
              )}
            </div>
            <form onSubmit={ask} className="flex gap-3 border-t border-slate-200 bg-white/70 p-4">
              <input name="question" placeholder="例如：这章考试重点是什么？" className="focus-ring min-w-0 flex-1 rounded border border-slate-200 px-4 py-3" />
              <button className="grid h-12 w-12 place-items-center rounded bg-coral text-white transition hover:bg-ink" title="发送">
                <Send size={19} />
              </button>
            </form>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-panel rounded p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ClipboardList size={19} /> 复习题
                </h2>
                <button onClick={runQuiz} disabled={busy === "quiz"} className="rounded bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-mint">生成</button>
              </div>
              <div className="prose-output max-h-96 overflow-y-auto text-sm text-slate-700">{quiz || "根据检索到的课程片段生成 5 道选择题。"}</div>
            </section>

            <section className="glass-panel rounded p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Languages size={19} /> 术语解释
              </h2>
              <form onSubmit={runTerms} className="space-y-3">
                <textarea name="text" rows={4} placeholder="粘贴术语或一段课件内容..." className="focus-ring w-full resize-none rounded border border-slate-200 px-3 py-3" />
                <button disabled={busy === "terms"} className="rounded bg-mint px-4 py-2 font-semibold text-white hover:bg-ink">解释术语</button>
              </form>
              <div className="prose-output mt-4 max-h-72 overflow-y-auto text-sm text-slate-700">{terms}</div>
            </section>
          </div>

          {summary && (
            <section className="glass-panel rounded p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <FileSearch size={19} /> 课件总结
              </h2>
              <div className="prose-output text-sm text-slate-700">{summary}</div>
            </section>
          )}
        </section>
      </div>
    </Shell>
  );
}
