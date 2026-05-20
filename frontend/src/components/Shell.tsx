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
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 text-slate-950 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-soft">
              <BookOpen size={21} />
            </span>
            <div>
              <p className="text-lg font-semibold leading-tight">CampusMind</p>
              <p className="text-xs text-slate-500">AI Study Workspace</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
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
            <span className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 lg:flex">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <Sparkles size={16} /> Online AI Ready
            </span>
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
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
