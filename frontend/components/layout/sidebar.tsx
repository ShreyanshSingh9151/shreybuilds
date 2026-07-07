"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChartBar, FlaskConical, Sparkles, WandSparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Demo Dashboard", icon: ChartBar },
  { href: "/evaluation", label: "Demo Bench", icon: FlaskConical },
  { href: "/actions", label: "Action Log", icon: WandSparkles },
  { href: "/memory", label: "Tone & Memory", icon: Bot }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-ink">MailPilot AI</h1>
          <p className="text-[11px] font-medium text-slate-400">Email Extension</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
              <Zap className="h-3 w-3 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-700">OpenRouter Routing Active</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
            Dashboard refreshes every 8s from the Go backend and OpenRouter profile analytics.
          </p>
        </div>
      </div>
    </aside>
  );
}
