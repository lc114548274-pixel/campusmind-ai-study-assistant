"use client";

import { BookOpen, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/86 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded bg-mint text-white">
              <BookOpen size={21} />
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight">CampusMind</p>
              <p className="text-xs text-slate-500">Course knowledge base</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800 sm:flex">
              <Sparkles size={16} /> RAG Study Assistant
            </span>
            <button
              className="grid h-10 w-10 place-items-center rounded border border-slate-200 bg-white text-slate-600 hover:border-coral hover:text-coral"
              title="Log out"
              onClick={() => {
                clearToken();
                router.push("/login");
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  );
}
