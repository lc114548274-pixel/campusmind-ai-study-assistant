"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { api, setToken } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result =
        mode === "register"
          ? await api.register({
              username: String(form.get("username")),
              email: String(form.get("email")),
              password: String(form.get("password"))
            })
          : await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      setToken(result.access_token);
      router.push("/dashboard");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mesh-grid grid min-h-screen place-items-center px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded border border-slate-200 bg-white shadow-soft lg:grid-cols-[1fr_440px]">
        <section className="relative hidden min-h-[620px] bg-ink p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,.35),transparent_28rem),radial-gradient(circle_at_80%_60%,rgba(231,111,81,.30),transparent_26rem)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <Sparkles size={16} /> 课程资料驱动的智能学习空间
              </span>
              <h1 className="mt-8 max-w-lg text-5xl font-semibold leading-tight">把 PDF 课件变成会回答问题的知识库。</h1>
              <p className="mt-5 max-w-md text-white/70">上传讲义、构建课程索引、生成总结与复习题，让每一次复习都有依据。</p>
            </div>
            <div className="grid gap-3">
              {["RAG 课件问答", "中英韩术语解释", "考前复习题生成"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <ShieldCheck size={19} className="text-teal-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="p-8 sm:p-10">
          <div className="mb-7 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded bg-mint text-white">
              <GraduationCap />
            </span>
            <div>
              <h1 className="text-3xl font-semibold">{mode === "login" ? "欢迎回来" : "创建账号"}</h1>
              <p className="text-sm text-slate-500">进入你的 CampusMind 学习空间。</p>
            </div>
          </div>
          {mode === "register" && (
            <label className="mb-4 block text-sm font-medium">
              用户名
              <input name="username" required minLength={2} className="focus-ring mt-2 w-full rounded border border-slate-200 px-3 py-3" />
            </label>
          )}
          <label className="mb-4 block text-sm font-medium">
            邮箱
            <input name="email" type="email" required className="focus-ring mt-2 w-full rounded border border-slate-200 px-3 py-3" />
          </label>
          <label className="mb-5 block text-sm font-medium">
            密码
            <input name="password" type="password" required minLength={8} className="focus-ring mt-2 w-full rounded border border-slate-200 px-3 py-3" />
          </label>
          {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-3 font-semibold text-white transition hover:bg-mint disabled:opacity-60">
            {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
            <ArrowRight size={18} />
          </button>
          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === "login" ? "还没有账号？" : "已经有账号？"}{" "}
            <Link className="font-semibold text-mint" href={mode === "login" ? "/register" : "/login"}>
              {mode === "login" ? "注册" : "登录"}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
