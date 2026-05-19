import { BarChart3, BookMarked, CheckCircle2, FileText, Flame, Gauge, Sparkles } from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/Shell";

const bars = [
  ["PDF 解析", 88],
  ["课件问答", 76],
  ["术语学习", 64],
  ["复习题", 58]
];

const timeline = ["创建课程", "上传 PDF", "生成索引", "开始问答", "生成复习题"];

export default function InsightsPage() {
  return (
    <Shell>
      <section className="mb-7 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="glass-panel rounded p-7">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-coral">
            <BarChart3 size={15} /> 可视化学习洞察
          </p>
          <h1 className="text-4xl font-semibold text-ink">把学习过程变成可追踪的仪表盘</h1>
          <p className="mt-3 max-w-2xl text-slate-600">这里展示项目后续可扩展的个性化功能：学习进度、知识覆盖、复习热度和推荐动作。</p>
        </div>
        <div className="glass-panel rounded p-5">
          <p className="text-sm text-slate-500">今日推荐</p>
          <h2 className="mt-2 text-2xl font-semibold">先复习 Link Layer 的 ARP 与 Ethernet Frame</h2>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded bg-mint px-4 py-2 font-semibold text-white hover:bg-ink">
            返回课程库 <Sparkles size={17} />
          </Link>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          [FileText, "资料页数", "46"],
          [BookMarked, "知识片段", "128"],
          [Flame, "复习热度", "高"],
          [Gauge, "完成度", "76%"]
        ].map(([Icon, label, value]) => {
          const DisplayIcon = Icon as typeof FileText;
          return (
            <div key={String(label)} className="glass-panel rounded p-5">
              <DisplayIcon className="text-mint" size={24} />
              <p className="mt-4 text-sm text-slate-500">{String(label)}</p>
              <p className="mt-1 text-3xl font-semibold">{String(value)}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="glass-panel rounded p-6">
          <h2 className="mb-5 text-2xl font-semibold">功能使用热力</h2>
          <div className="space-y-5">
            {bars.map(([label, value]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>{label}</span>
                  <span>{value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-mint via-sky-400 to-coral" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded p-6">
          <h2 className="mb-5 text-2xl font-semibold">学习流程</h2>
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded border border-slate-200 bg-white p-3">
                <span className="grid h-9 w-9 place-items-center rounded bg-teal-50 text-mint">
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <p className="font-semibold">{item}</p>
                  <p className="text-xs text-slate-500">Step {index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
