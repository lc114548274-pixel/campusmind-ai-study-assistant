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
      setError(exc instanceof Error ? exc.message : "Request failed");
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
            <h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
            <p className="text-sm text-slate-500">Build your course AI knowledge base.</p>
          </div>
        </div>
        {mode === "register" && (
          <label className="mb-4 block text-sm font-medium">
            Username
            <input name="username" required minLength={2} className="mt-2 w-full rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
          </label>
        )}
        <label className="mb-4 block text-sm font-medium">
          Email
          <input name="email" type="email" required className="mt-2 w-full rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
        </label>
        <label className="mb-5 block text-sm font-medium">
          Password
          <input name="password" type="password" required minLength={8} className="mt-2 w-full rounded border border-slate-200 px-3 py-3 outline-none focus:border-mint" />
        </label>
        {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-ink px-4 py-3 font-semibold text-white hover:bg-mint disabled:opacity-60">
          {loading ? "Working..." : mode === "login" ? "Log in" : "Register"}
        </button>
        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <Link className="font-semibold text-mint" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Register" : "Log in"}
          </Link>
        </p>
      </form>
    </main>
  );
}
