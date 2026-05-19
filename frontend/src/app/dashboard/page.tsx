"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Plus, RefreshCw } from "lucide-react";
import { Shell } from "@/components/Shell";
import { api, Course } from "@/lib/api";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setCourses(await api.courses());
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    if (!name.trim()) return;
    await api.createCourse({ name, description: String(form.get("description") || "") });
    event.currentTarget.reset();
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Shell>
      <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-coral">Study workspace</p>
          <h1 className="text-4xl font-semibold text-ink">Your course knowledge base</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Upload lecture PDFs, ask grounded questions, generate summaries, quizzes, and multilingual term notes.</p>
        </div>
        <button onClick={load} className="inline-flex h-11 items-center gap-2 rounded border border-slate-200 bg-white px-4 font-medium text-slate-700 hover:border-mint hover:text-mint">
          <RefreshCw size={17} /> Refresh
        </button>
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createCourse} className="rounded border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Plus size={19} /> Create course
          </h2>
          <label className="mb-4 block text-sm font-medium">
            Course name
            <input name="name" placeholder="Computer Networks" className="mt-2 w-full rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
          </label>
          <label className="mb-4 block text-sm font-medium">
            Description
            <textarea name="description" rows={4} placeholder="Lecture notes, exam focus, textbook chapters..." className="mt-2 w-full resize-none rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
          </label>
          <button className="w-full rounded bg-mint px-4 py-3 font-semibold text-white hover:bg-ink">Create</button>
          {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>

        <section className="grid gap-4 md:grid-cols-2">
          {loading && <div className="rounded border border-slate-200 bg-white p-6 text-slate-500">Loading courses...</div>}
          {!loading && courses.length === 0 && <div className="rounded border border-slate-200 bg-white p-6 text-slate-500">Create your first course to start.</div>}
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group rounded border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-mint">
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded bg-teal-50 text-mint">
                  <BookOpen size={21} />
                </span>
                <span className="inline-flex items-center gap-2 rounded border border-slate-200 px-3 py-1 text-sm text-slate-600">
                  <FileText size={15} /> {course.document_count}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-ink group-hover:text-mint">{course.name}</h3>
              <p className="mt-2 line-clamp-3 min-h-12 text-sm text-slate-600">{course.description || "No description yet."}</p>
            </Link>
          ))}
        </section>
      </div>
    </Shell>
  );
}
