"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import { Shell } from "@/components/Shell";
import { api, Course } from "@/lib/api";

const presets = ["计算机网络", "人工智能导论", "数据库系统", "韩语专业术语"];

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const filteredCourses = useMemo(
    () => courses.filter((course) => `${course.name} ${course.description || ""}`.toLowerCase().includes(query.toLowerCase())),
    [courses, query]
  );

  async function load() {
    setLoading(true);
    try {
      setCourses(await api.courses());
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
    const name = String(form.get("name"));
    if (!name.trim()) return;
    await api.createCourse({ name, description: String(form.get("description") || "") });
    formElement.reset();
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <section className="mb-7 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="tech-panel rounded p-7">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-900">
            <Sparkles size={15} /> 智能课程库
          </p>
          <h1 className="text-4xl font-semibold text-ink md:text-5xl">选择一门课程，进入 AI 学习流程</h1>
          <p className="mt-4 max-w-2xl text-slate-600">课程列表是整个系统的入口。你可以创建课程、上传 PDF、进入详情页进行问答、总结和复习题生成。</p>
          <div className="mt-6 flex max-w-xl items-center gap-3 rounded border border-slate-200 bg-white px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程、关键词或说明" className="min-w-0 flex-1 bg-transparent outline-none" />
          </div>
        </div>

        <form onSubmit={createCourse} className="tech-panel rounded p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Plus size={19} /> 创建课程
          </h2>
          <label className="mb-4 block text-sm font-medium">
            课程名称
            <input name="name" placeholder="计算机网络" className="focus-ring mt-2 w-full rounded border border-slate-200 px-3 py-3" />
          </label>
          <label className="mb-4 block text-sm font-medium">
            课程说明
            <textarea name="description" rows={4} placeholder="课件范围、考试重点、教材章节..." className="focus-ring mt-2 w-full resize-none rounded border border-slate-200 px-3 py-3" />
          </label>
          <div className="mb-4 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button key={preset} type="button" onClick={() => setQuery(preset)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-mint hover:text-mint">
                {preset}
              </button>
            ))}
          </div>
          <button className="w-full rounded bg-mint px-4 py-3 font-semibold text-white transition hover:bg-ink">创建课程</button>
          {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>
      </section>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">课程列表</h2>
        <button onClick={load} className="inline-flex h-11 items-center gap-2 rounded border border-slate-200 bg-white px-4 font-medium text-slate-700 hover:border-mint hover:text-mint">
          <RefreshCw size={17} /> 刷新
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && <div className="glass-panel rounded p-6 text-slate-500">正在加载课程...</div>}
        {!loading && filteredCourses.length === 0 && <div className="glass-panel rounded p-6 text-slate-500">暂无匹配课程。创建第一门课程后即可开始。</div>}
        {filteredCourses.map((course, index) => {
          const progress = Math.min(96, 22 + course.document_count * 18 + index * 7);
          return (
            <Link key={course.id} href={`/courses/${course.id}`} className="group tech-panel rounded p-5 transition hover:-translate-y-1 hover:border-cyan-300">
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded bg-ink text-white">
                  <BookOpen size={22} />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
                  <FileText size={15} /> {course.document_count} 份资料
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-semibold text-ink group-hover:text-mint">{course.name}</h3>
                <ArrowUpRight size={19} className="text-slate-400 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-coral" />
              </div>
              <p className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-slate-600">{course.description || "暂无课程说明。进入详情页上传 PDF 后即可构建知识库。"}</p>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-slate-500">
                  <span>知识库完成度</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-mint to-coral" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </Shell>
  );
}
