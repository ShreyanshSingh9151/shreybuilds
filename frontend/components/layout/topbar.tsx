"use client";

import { Activity } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Extension Dashboard",
    description: "Track OpenRouter routing, AI triage, and draft generation"
  },
  "/actions": {
    title: "Extension Action Log",
    description: "Every classify, summarize, reply, and rewrite call via OpenRouter"
  },
  "/memory": {
    title: "Memory and Personalization",
    description: "Set profile, tone, signature, and instructions used in replies"
  },
  "/evaluation": {
    title: "Demo Bench / Evaluation",
    description: "Compare routing quality, latency, and savings across Gmail and Outlook Web"
  }
};

export function Topbar() {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? pageTitles["/"]!;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div>
          <h2 className="text-lg font-semibold text-ink">{page.title}</h2>
          <p className="text-xs text-slate-500">{page.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-slate-600">Live</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
            <Activity className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Go API + OpenRouter</span>
          </div>
        </div>
      </div>
    </header>
  );
}
