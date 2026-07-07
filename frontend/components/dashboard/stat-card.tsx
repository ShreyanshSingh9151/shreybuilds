import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  trend?: "up" | "neutral";
};

export function StatCard({ title, value, helper, icon: Icon, trend = "neutral" }: StatCardProps) {
  return (
    <div className="card animate-fade-in overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{helper}</p>
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
