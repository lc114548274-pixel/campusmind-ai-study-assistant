"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, BrainCircuit, ClipboardList, FileQuestion, Languages, RotateCcw, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";

const modes = [
  { id: "ask", label: "智能问答", icon: FileQuestion, hint: "将问题交给课程 RAG 问答工具，支持来源引用。" },
  { id: "summary", label: "重点总结", icon: ClipboardList, hint: "整理重点、复习清单和可能考点。" },
  { id: "quiz", label: "生成复习题", icon: BookOpenCheck, hint: "生成选择题、答案和解析。" },
  { id: "glossary", label: "术语解释", icon: Languages, hint: "生成中英韩术语解释表。" }
];

export default function LabPage() {
  const [mode, setMode] = useState("glossary");
  const [language, setLanguage] = useState("zh");
  const [text, setText] = useState("路由表、分组交换、链路层、ARP 地址解析协议");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolCount, setToolCount] = useState(4);

  const activeMode = useMemo(() => modes.find((item) => item.id === mode) || modes[0], [mode]);

  useEffect(() => {
    api.agentTools().then((tools) => setToolCount(tools.length)).catch(() => setToolCount(4));
  }, []);

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const response = await api.agentRun({ tool: mode, text, language });
      setResult(response.content);
    } catch (error) {
      setResult(error instanceof Error ? error.message : "工具运行失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <section className="mb-7 tech-panel p-8">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          <BrainCircuit size={15} /> Agent 工具台 · {toolCount} 个工具
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-slate-950">四种学习工具，由后端工具接口统一调度。</h1>
        <p className="mt-3 max-w-2xl leading-8 text-slate-600">
          借鉴 CSU-CampusMind 的工具调用思路，把智能问答、重点总结、复习题和术语解释抽象成统一工具层。课程详情页负责真实资料学习，这里负责快速实验和能力展示。
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="tech-panel p-5">
            <h2 className="mb-4 text-lg font-semibold">选择模式</h2>
            <div className="grid gap-3">
              {modes.map((item) => {
                const Icon = item.icon;
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`flex items-center gap-3 rounded-3xl border p-4 text-left transition ${
                      active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-violet-200"
                    }`}
                  >
                    <Icon size={21} />
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="tech-panel p-5">
            <h2 className="mb-4 text-lg font-semibold">输出语言</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["zh", "中文"],
                ["en", "英文"],
                ["ko", "韩文"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLanguage(value)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium ${
                    language === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <form onSubmit={run} className="tech-panel p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-slate-950">{activeMode.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{activeMode.hint}</p>
            </div>
            <button
              type="button"
              onClick={() => setText("")}
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-600"
              title="清空"
            >
              <RotateCcw size={17} />
            </button>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            className="focus-ring w-full resize-none rounded-3xl border border-slate-200 bg-white px-5 py-4"
            placeholder="输入术语、课件段落、问题或需要解释的概念..."
          />
          <button disabled={loading || !text.trim()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
            <Sparkles size={18} /> {loading ? "生成中..." : "运行学习工具"}
          </button>
          <div className="prose-output mt-6 min-h-56 whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            {result || "生成结果会显示在这里。"}
          </div>
        </form>
      </div>
    </Shell>
  );
}
