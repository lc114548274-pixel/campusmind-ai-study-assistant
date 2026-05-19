"use client";

import { BarChart3, BookOpen, BrainCircuit, Home, LibraryBig, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/dashboard", label: "课程库", icon: LibraryBig },
  { href: "/lab", label: "AI 工具台", icon: BrainCircuit },
  { href: "/insights", label: "学习洞察", icon: BarChart3 }
];

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/86 text-slate-950 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded bg-slate-950 text-white shadow-soft">
              <BookOpen size={21} />
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight">CampusMind</p>
              <p className="text-xs text-slate-500">AI 课程学习助手</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-white text-slate-950 shadow-soft" : "text-slate-500 hover:bg-white hover:text-slate-950"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 lg:flex">
              <span className="pulse-dot h-2 w-2 rounded-full bg-mint" />
              <Sparkles size={16} /> 在线 AI 已接入
            </span>
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-coral hover:text-coral"
              title="退出登录"
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
      <div className="mx-auto max-w-7xl px-5 py-8">{children}</div>
    </main>
  );
}
