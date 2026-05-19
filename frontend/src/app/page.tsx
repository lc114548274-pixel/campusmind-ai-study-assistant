import { ArrowRight, BarChart3, BookOpen, BrainCircuit, FileText, Languages, Sparkles } from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/Shell";

const features = [
  { icon: FileText, title: "PDF 智能解析", text: "自动提取课件文本、切分知识片段并建立可检索索引。" },
  { icon: BrainCircuit, title: "基于资料问答", text: "回答只围绕上传课件展开，尽量减少脱离资料的幻觉。" },
  { icon: Languages, title: "中英韩术语表", text: "面向韩国留学场景，快速理解课程中的关键术语。" },
  { icon: BarChart3, title: "学习洞察", text: "用可视化展示课程资料、复习重点和学习进度。" }
];

export default function HomePage() {
  return (
    <Shell>
      <section className="grid min-h-[calc(100vh-140px)] items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
            <Sparkles size={16} /> Local-first + Online AI Gateway
          </span>
          <h1 className="gradient-text mt-6 max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
            CampusMind
            <br />
            让课件变成你的 AI 学习搭子
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            上传课程 PDF，系统会自动解析、检索、总结并生成复习题。适合大学课程复习、考试准备和中英韩术语学习。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded bg-ink px-5 py-3 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-mint">
              进入课程库 <ArrowRight size={18} />
            </Link>
            <Link href="/lab" className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-coral hover:text-coral">
              打开 AI 工具台
            </Link>
          </div>
        </div>

        <div className="glass-panel scan-line rounded p-6">
          <div className="rounded bg-ink p-5 text-white">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded bg-white/10">
                  <BookOpen />
                </span>
                <div>
                  <p className="font-semibold">Computer Networks</p>
                  <p className="text-sm text-white/55">Chapter 6 · Link Layer</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-300/20 px-3 py-1 text-sm text-teal-100">已索引</span>
            </div>
            <div className="space-y-3">
              {["CRC 计算", "ARP 工作流程", "交换机学习与转发", "以太网帧结构"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded border border-white/10 bg-white/8 p-3">
                  <span className="grid h-8 w-8 place-items-center rounded bg-white text-ink">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="glass-panel rounded p-5 transition hover:-translate-y-1">
              <span className="grid h-11 w-11 place-items-center rounded bg-teal-50 text-mint">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </div>
          );
        })}
      </section>
    </Shell>
  );
}
