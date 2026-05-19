"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, ClipboardList, FileUp, Languages, Loader2, MessageSquare, NotebookTabs, Send, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";
import { api, ChatSource, Course, DocumentItem } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; sources?: ChatSource[] };

export default function CoursePage({ params }: { params: { id: string } }) {
  const courseId = params.id;
  const [course, setCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [language, setLanguage] = useState("zh");
  const [busy, setBusy] = useState("");
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState("");
  const [terms, setTerms] = useState("");
  const readyDocuments = useMemo(() => documents.filter((doc) => doc.status === "ready"), [documents]);

  async function load() {
    const [courseData, docs] = await Promise.all([api.course(courseId), api.documents(courseId)]);
    setCourse(courseData);
    setDocuments(docs);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = (new FormData(event.currentTarget).get("file") as File) || null;
    if (!file || file.size === 0) return;
    setBusy("upload");
    await api.uploadDocument(courseId, file);
    event.currentTarget.reset();
    await load();
    setBusy("");
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const question = String(form.get("question") || "").trim();
    if (!question) return;
    setMessages((current) => [...current, { role: "user", content: question }]);
    event.currentTarget.reset();
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
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-coral">Course</p>
          <h1 className="text-3xl font-semibold text-ink">{course?.name || "Loading..."}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{course?.description || "Upload lecture material to build this course knowledge base."}</p>
        </div>
        <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-11 rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-mint">
          <option value="zh">Chinese</option>
          <option value="en">English</option>
          <option value="ko">Korean</option>
        </select>
      </section>

      <div className="grid gap-6 xl:grid-cols-[370px_1fr]">
        <aside className="space-y-5">
          <form onSubmit={upload} className="rounded border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileUp size={19} /> Upload PDF
            </h2>
            <input name="file" type="file" accept="application/pdf" className="mb-4 block w-full rounded border border-slate-200 bg-slate-50 p-3 text-sm" />
            <button disabled={busy === "upload"} className="inline-flex w-full items-center justify-center gap-2 rounded bg-mint px-4 py-3 font-semibold text-white hover:bg-ink disabled:opacity-60">
              {busy === "upload" && <Loader2 className="animate-spin" size={17} />} Process PDF
            </button>
          </form>

          <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <NotebookTabs size={19} /> Documents
            </h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{doc.file_name}</p>
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{doc.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{doc.page_count} pages · {doc.chunk_count} chunks</p>
                  {doc.status === "ready" && (
                    <button onClick={() => runSummary(doc.id)} className="mt-3 inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm font-medium hover:border-coral hover:text-coral">
                      <Sparkles size={15} /> Summarize
                    </button>
                  )}
                  {doc.error_message && <p className="mt-2 text-xs text-red-600">{doc.error_message}</p>}
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-slate-500">No PDFs uploaded yet.</p>}
            </div>
          </section>
        </aside>

        <section className="grid gap-6">
          <div className="rounded border border-slate-200 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare size={19} /> Ask course material
              </h2>
              <span className="text-sm text-slate-500">{readyDocuments.length} ready documents</span>
            </div>
            <div className="max-h-[430px] min-h-[260px] space-y-4 overflow-y-auto p-5">
              {messages.length === 0 && <p className="text-slate-500">Ask a question after uploading a PDF. Answers will cite retrieved lecture chunks.</p>}
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "ml-auto max-w-3xl rounded bg-ink p-4 text-white" : "max-w-3xl rounded border border-slate-200 bg-slate-50 p-4"}>
                  <div className="prose-output text-sm">{message.content}</div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <span key={source.chunk_id} className="rounded bg-white px-2 py-1 text-xs text-slate-600">
                          {source.document_name} p.{source.page}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy === "chat" && <p className="flex items-center gap-2 text-sm text-slate-500"><Bot size={17} /> Thinking...</p>}
            </div>
            <form onSubmit={ask} className="flex gap-3 border-t border-slate-200 p-4">
              <input name="question" placeholder="例如：这章考试重点是什么？" className="min-w-0 flex-1 rounded border border-slate-200 px-4 py-3 outline-none focus:border-mint" />
              <button className="grid h-12 w-12 place-items-center rounded bg-coral text-white hover:bg-ink" title="Send">
                <Send size={19} />
              </button>
            </form>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><ClipboardList size={19} /> Quiz</h2>
                <button onClick={runQuiz} disabled={busy === "quiz"} className="rounded bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-mint">Generate</button>
              </div>
              <div className="prose-output max-h-96 overflow-y-auto text-sm text-slate-700">{quiz || "Generate 5 multiple-choice questions from retrieved course chunks."}</div>
            </section>

            <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Languages size={19} /> Terms</h2>
              <form onSubmit={runTerms} className="space-y-3">
                <textarea name="text" rows={4} placeholder="Paste terms or a lecture paragraph..." className="w-full resize-none rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
                <button disabled={busy === "terms"} className="rounded bg-mint px-4 py-2 font-semibold text-white hover:bg-ink">Translate terms</button>
              </form>
              <div className="prose-output mt-4 max-h-72 overflow-y-auto text-sm text-slate-700">{terms}</div>
            </section>
          </div>

          {summary && (
            <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Sparkles size={19} /> Summary</h2>
              <div className="prose-output text-sm text-slate-700">{summary}</div>
            </section>
          )}
        </section>
      </div>
    </Shell>
  );
}
