"use client";

import { useEffect, useState } from "react";
import { BarChart3, BookMarked, CheckCircle2, FileText, Gauge, Sparkles, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { api, StudyStats } from "@/lib/api";

const trend = [28, 42, 36, 58, 64, 72, 86];
const weakPoints = ["链路层地址解析", "数据库事务隔离级别", "软件定义网络控制平面", "中英韩术语互译"];

export default function InsightsPage() {
  const [stats, setStats] = useState<StudyStats | null>(null);

  useEffect(() => {
    api.studyStats().then(setStats).catch(() => setStats(null));
  }, []);

  const cards = [
    [FileText, "总课程数", stats?.course_count ?? 0],
    [BookMarked, "总文档数", stats?.document_count ?? 0],
    [Trophy, "练习完成数", stats?.attempt_count ?? 0],
    [Gauge, "平均分", `${stats?.average_score ?? 0}%`]
  ] as const;

  return (
    <Shell>
      <section className="mb-7 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="tech-panel p-8">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            <BarChart3 size={15} /> 学习洞察
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight text-slate-950">把学习过程变成可追踪的仪表盘。</h1>
          <p className="mt-3 max-w-2xl leading-8 text-slate-600">这里汇总课程、资料、复习题、平均分和近期活动。后续可以继续扩展成错题本、薄弱知识点和记忆曲线。</p>
        </div>
        <div className="tech-panel p-6">
          <p className="text-sm font-semibold text-blue-600">今日推荐</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">先复习最近上传资料中的高频概念。</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">建议先完成一套复习题，再回到课程详情页针对错题提问。</p>
          <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-blue-600">
            返回课程库 <Sparkles size={17} />
          </Link>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        {cards.map(([Icon, label, value]) => (
          <div key={label} className="glass-panel p-5">
            <Icon className="text-blue-600" size={24} />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="glass-panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">每周趋势</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">最近 7 天学习活跃度</h2>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">提升 18%</span>
          </div>
          <div className="flex h-64 items-end gap-3 rounded-3xl bg-slate-50 p-5">
            {trend.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-2xl bg-gradient-to-t from-blue-500 to-violet-400" style={{ height: `${value}%` }} />
                <span className="text-xs text-slate-500">第 {index + 1} 天</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-6">
          <h2 className="mb-5 text-2xl font-semibold text-slate-950">最近学习活动</h2>
          <div className="space-y-3">
            {(stats?.recent_activity || []).length === 0 && <p className="text-sm text-slate-500">暂无活动。上传 PDF 或生成复习题后会显示在这里。</p>}
            {(stats?.recent_activity || []).map((item) => (
              <div key={`${item.type}-${item.title}-${item.created_at}`} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <CheckCircle2 size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.type} · {item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 glass-panel p-6">
        <div className="mb-5 flex items-center gap-2">
          <Target className="text-violet-600" size={22} />
          <h2 className="text-2xl font-semibold text-slate-950">薄弱知识点</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {weakPoints.map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{item}</p>
              <p className="mt-2 text-sm text-slate-500">建议生成专项复习题并查看解析。</p>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
