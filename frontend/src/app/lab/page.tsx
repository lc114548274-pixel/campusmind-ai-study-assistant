"use client";

import { FormEvent, useMemo, useState } from "react";
import { BrainCircuit, ClipboardList, Languages, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";

const modes = [
  { id: "terms", label: "术语解释", icon: Languages, hint: "提取中英韩术语表" },
  { id: "review", label: "复习清单", icon: ClipboardList, hint: "生成考前 checklist" },
  { id: "explain", label: "概念讲解", icon: BrainCircuit, hint: "用简单语言解释概念" }
];

export default function LabPage() {
  const [mode, setMode] = useState("terms");
  const [language, setLanguage] = useState("zh");
  const [text, setText] = useState("Routing Table, Packet Switching, Link Layer, ARP");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const activeMode = useMemo(() => modes.find((item) => item.id === mode) || modes[0], [mode]);

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "terms") {
        const response = await api.terms({ text, source_language: "auto", target_language: language });
        setResult(response.content);
      } else {
        setResult(`请把以下内容用于课程学习：\n\n${text}\n\n当前模式：${activeMode.label}\n\n提示：该模式可继续扩展为专用后端接口。`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <section className="mb-7 tech-panel rounded p-7">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          <Wand2 size={15} /> 动态配置工具台
        </p>
        <h1 className="text-5xl font-semibold text-slate-950">AI 学习工具台</h1>
        <p className="mt-3 max-w-2xl text-slate-600">通过模式切换、语言选择和文本输入，快速生成术语解释、复习清单和概念讲解。这个页面展示了可扩展的功能配置流。</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="tech-panel rounded p-5">
            <h2 className="mb-4 text-lg font-semibold">选择模式</h2>
            <div className="grid gap-3">
              {modes.map((item) => {
                const Icon = item.icon;
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={`flex items-center gap-3 rounded border p-4 text-left transition ${
                      active ? "border-mint bg-teal-50 text-mint" : "border-slate-200 bg-white text-slate-700 hover:border-coral"
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

          <section className="tech-panel rounded p-5">
            <h2 className="mb-4 text-lg font-semibold">输出语言</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["zh", "中文"],
                ["en", "英文"],
                ["ko", "韩文"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={`rounded border px-3 py-2 text-sm font-medium ${language === value ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <form onSubmit={run} className="tech-panel rounded p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{activeMode.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{activeMode.hint}</p>
            </div>
            <button type="button" onClick={() => setText("")} className="grid h-10 w-10 place-items-center rounded border border-slate-200 bg-white text-slate-500 hover:border-coral hover:text-coral" title="清空">
              <RotateCcw size={17} />
            </button>
          </div>
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={9} className="focus-ring w-full resize-none rounded border border-slate-200 bg-white px-4 py-3" placeholder="输入术语、课件段落或需要解释的概念..." />
          <button disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded bg-ink px-5 py-3 font-semibold text-white hover:bg-mint disabled:opacity-60">
            <Sparkles size={18} /> {loading ? "生成中..." : "生成结果"}
          </button>
          <div className="prose-output mt-6 min-h-52 rounded border border-slate-200 bg-white p-5 text-sm text-slate-700">
            {result || "生成结果会显示在这里。"}
          </div>
        </form>
      </div>
    </Shell>
  );
}
