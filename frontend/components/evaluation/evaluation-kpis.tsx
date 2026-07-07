"use client";

import type { EvaluationSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChart3, Clock3, Coins, ShieldCheck, Users } from "lucide-react";

export function EvaluationKpis({ summary }: { summary: EvaluationSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Average Latency" value={`${summary.average_latency_ms.toFixed(0)} ms`} helper="Across benchmark runs" icon={Clock3} />
      <StatCard title="Average Cost" value={formatCurrency(summary.average_cost_usd)} helper="Per benchmark run" icon={Coins} />
      <StatCard title="Total Savings" value={formatCurrency(summary.total_savings_usd)} helper="Routing vs baseline" icon={BarChart3} />
      <StatCard title="Pass Rate" value={`${Math.round(summary.pass_rate * 100)}%`} helper="Match / accuracy score" icon={ShieldCheck} />
      <StatCard title="Provider Coverage" value={String(summary.provider_count)} helper={summary.provider_coverage} icon={Users} />
    </div>
  );
}
