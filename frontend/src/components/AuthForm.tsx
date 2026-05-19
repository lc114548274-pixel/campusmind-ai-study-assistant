"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
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
    <main className="grid min-h-screen place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-md rounded border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded bg-mint text-white">
            <GraduationCap />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">{mode === "login" ? "欢迎回来" : "创建账号"}</h1>
            <p className="text-sm text-slate-500">构建你的课程 AI 知识库。</p>
          </div>
        </div>
        {mode === "register" && (
          <label className="mb-4 block text-sm font-medium">
            用户名
            <input name="username" required minLength={2} className="mt-2 w-full rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
          </label>
        )}
        <label className="mb-4 block text-sm font-medium">
          邮箱
          <input name="email" type="email" required className="mt-2 w-full rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
        </label>
        <label className="mb-5 block text-sm font-medium">
          密码
          <input name="password" type="password" required minLength={8} className="mt-2 w-full rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
        </label>
        {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-ink px-4 py-3 font-semibold text-white hover:bg-mint disabled:opacity-60">
          {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </button>
        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "login" ? "还没有账号？" : "已经有账号？"}{" "}
          <Link className="font-semibold text-mint" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "注册" : "登录"}
          </Link>
        </p>
      </form>
    </main>
  );
}
