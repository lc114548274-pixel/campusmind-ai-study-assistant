import { ArrowRight, BarChart3, BookOpenCheck, FileQuestion, FileText, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/Shell";

const features = [
  {
    icon: FileText,
    title: "上传课程 PDF",
    text: "上传课件后自动解析文本、切分知识片段，并建立可检索的课程知识库。"
  },
  {
    icon: FileQuestion,
    title: "带引用的课程问答",
    text: "基于课件内容回答问题，并清晰展示来源文件、页码和原文片段。"
  },
  {
    icon: BookOpenCheck,
    title: "生成复习题",
    text: "自动生成总结、复习清单和选择题，支持作答、判分和解析反馈。"
  }
];

const flow = ["上传资料", "建立知识库", "提问并引用", "练习测验", "追踪进度"];

export default function HomePage() {
  return (
    <Shell>
      <section className="grid min-h-[calc(100vh-160px)] items-center gap-12 py-8 lg:grid-cols-[1.02fr_.98fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <Sparkles size={16} /> 本地优先的 AI 学习工作台
          </span>
          <h1 className="mt-7 max-w-4xl text-6xl font-semibold leading-[1.02] tracking-tight text-slate-950 md:text-8xl">
            CampusMind
            <span className="gradient-text block">你的 AI 课程学习空间</span>
          </h1>
          <div className="mt-7 max-w-2xl space-y-2 text-xl leading-8 text-slate-600">
            <p>上传课程 PDF。</p>
            <p>基于来源引用提问。</p>
            <p>自动生成总结和复习题。</p>
            <p>持续追踪学习进度。</p>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-blue-600">
              开始使用 <ArrowRight size={18} />
            </Link>
            <Link href="/lab" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600">
              查看 AI 工具台
            </Link>
          </div>
        </div>

        <div className="glass-panel p-4">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500">
                  <GraduationCap />
                </span>
                <div>
                  <p className="font-semibold">计算机网络</p>
                  <p className="text-sm text-white/55">第 6 章 · 链路层</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-blue-100">知识库已就绪</span>
            </div>
            <div className="rounded-3xl bg-white p-5 text-slate-950">
              <p className="text-sm font-semibold text-blue-600">AI 回答</p>
              <h3 className="mt-2 text-2xl font-semibold">ARP 用来把 IP 地址解析为链路层地址。</h3>
              <p className="mt-3 leading-7 text-slate-600">
                根据课件，主机在同一局域网中通信前，会查询或广播 ARP 请求，以获得目标 IP 对应的 MAC 地址。
              </p>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-600">来源</p>
                <p className="mt-1 text-sm font-semibold">第 6 章 - 链路层.pdf · 第 12 页</p>
                <p className="mt-2 text-sm text-slate-600">“ARP: address resolution protocol ...”</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {["128 个片段", "5 套题", "84% 平均分"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/85">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 py-10 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="glass-panel p-6 transition hover:-translate-y-1">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 text-blue-600">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{feature.text}</p>
            </div>
          );
        })}
      </section>

      <section className="glass-panel my-8 p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">学习流程</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">从上传资料到复习反馈，一条完整学习闭环。</h2>
          </div>
          <BarChart3 className="hidden text-violet-500 md:block" size={34} />
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {flow.map((item, index) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-sm font-semibold text-blue-600">0{index + 1}</span>
              <p className="mt-3 font-semibold text-slate-950">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-blue-600">产品预览</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">清晰、克制、面向学习效率的界面。</h2>
          <p className="mt-4 leading-8 text-slate-600">课程库、学习洞察和 AI 工具台都围绕“学习工作台”设计，避免过度装饰，把注意力放在资料、回答、引用和练习结果上。</p>
          <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-slate-950">
            进入课程库 <ArrowRight size={18} />
          </Link>
        </div>
        <div className="glass-panel p-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-slate-950">课程库</p>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">3 门课程</span>
            </div>
            {["计算机网络", "数据库系统", "人工智能导论"].map((course, index) => (
              <div key={course} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 last:mb-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-950">{course}</p>
                  <span className="text-sm text-slate-500">{index + 2} 份 PDF</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${62 + index * 12}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
