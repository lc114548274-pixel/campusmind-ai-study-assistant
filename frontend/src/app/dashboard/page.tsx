"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, FileText, Plus, RefreshCw, Search, Sparkles, Trash2, Trophy } from "lucide-react";
import { Shell } from "@/components/Shell";
import { api, Course } from "@/lib/api";

const presets = ["计算机网络", "人工智能导论", "数据库系统", "韩国语专业术语"];

function formatDate(value?: string | null) {
  if (!value) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredCourses = useMemo(
    () => courses.filter((course) => `${course.name} ${course.description || ""}`.toLowerCase().includes(query.toLowerCase())),
    [courses, query]
  );

  async function load() {
    setLoading(true);
    try {
      setCourses(await api.courses());
      setError("");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "课程加载失败，请先登录。");
    } finally {
      setLoading(false);
    }
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "");
    if (!name.trim()) return;
    await api.createCourse({ name, description: String(form.get("description") || "") });
    formElement.reset();
    await load();
  }

  async function deleteCourse(course: Course) {
    const confirmed = window.confirm(`确定要删除“${course.name}”吗？课程资料、问答记录和题库都会一起删除。`);
    if (!confirmed) return;
    setDeletingId(course.id);
    try {
      await api.deleteCourse(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "课程删除失败，请稍后重试。");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <section className="mb-8 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="tech-panel p-8">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            <Sparkles size={15} /> 学习工作台
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">选择一门课程，继续你的 AI 学习流程。</h1>
          <p className="mt-4 max-w-2xl leading-8 text-slate-600">课程库展示每门课的资料数量、复习题数量、最近学习时间和知识库进度。进入课程后即可上传资料、问答、总结和练习。</p>
          <div className="mt-6 flex max-w-xl items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程、关键词或说明" className="min-w-0 flex-1 bg-transparent outline-none" />
          </div>
        </div>

        <form onSubmit={createCourse} className="tech-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Plus size={19} /> 创建课程
          </h2>
          <label className="mb-4 block text-sm font-medium">
            课程名称
            <input name="name" placeholder="计算机网络" className="focus-ring mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
          </label>
          <label className="mb-4 block text-sm font-medium">
            课程说明
            <textarea name="description" rows={4} placeholder="课件范围、考试重点、教材章节..." className="focus-ring mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3" />
          </label>
          <div className="mb-4 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button key={preset} type="button" onClick={() => setQuery(preset)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600">
                {preset}
              </button>
            ))}
          </div>
          <button className="w-full rounded-full bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-blue-600">创建课程</button>
          {error && <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>
      </section>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">课程卡片</h2>
          <p className="mt-1 text-sm text-slate-500">一眼看到自己学了什么、练了多少、进度到哪里。</p>
        </div>
        <button onClick={load} className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-soft hover:border-blue-300 hover:text-blue-600">
          <RefreshCw size={17} /> 刷新
        </button>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && <div className="glass-panel p-6 text-slate-500">正在加载课程...</div>}
        {!loading && filteredCourses.length === 0 && <div className="glass-panel p-6 text-slate-500">暂无匹配课程。创建第一门课程后即可开始。</div>}
        {filteredCourses.map((course) => {
          const progress = course.progress ?? Math.min(100, 18 + course.document_count * 24 + (course.quiz_count || 0) * 12);
          return (
            <div key={course.id} className="tech-panel group p-6 transition hover:-translate-y-1 hover:border-blue-200">
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-soft">
                  <BookOpen size={22} />
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
                    {progress}% 完成
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteCourse(course)}
                    disabled={deletingId === course.id}
                    className="grid h-9 w-9 place-items-center rounded-full border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    title="删除课程"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{course.name}</h3>
              <p className="mt-2 line-clamp-3 min-h-14 text-sm leading-6 text-slate-600">{course.description || "暂无课程说明。进入课程详情页上传 PDF 后即可构建知识库。"}</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <FileText size={16} className="text-blue-600" />
                  <p className="mt-2 text-xs text-slate-500">文档</p>
                  <p className="font-semibold">{course.document_count}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <Trophy size={16} className="text-violet-600" />
                  <p className="mt-2 text-xs text-slate-500">复习题</p>
                  <p className="font-semibold">{course.quiz_count || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <CalendarClock size={16} className="text-slate-600" />
                  <p className="mt-2 text-xs text-slate-500">最近</p>
                  <p className="truncate text-xs font-semibold">{formatDate(course.last_activity_at)}</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <Link href={`/courses/${course.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-blue-600">
                进入课程 <ArrowRight size={18} />
              </Link>
            </div>
          );
        })}
      </section>
    </Shell>
  );
}
