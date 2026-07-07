"use client";

import type { BenchmarkScenario } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

export function ComparePanel({ scenario }: { scenario: BenchmarkScenario }) {
  const costDelta = scenario.fixed_cost_usd - scenario.cost_usd;
  const latencyDelta = scenario.fixed_latency_ms - scenario.latency_ms;

  return (
    <section className="card-elevated overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">Compare Mode</h3>
        <p className="mt-0.5 text-xs text-slate-500">Auto-routing versus fixed logical model on the same benchmark</p>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Auto route</p>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge value={scenario.routed_model} kind="model" />
            <span className="text-xs text-slate-500">{scenario.route_reason}</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Latency: {scenario.latency_ms} ms</p>
            <p>Cost: {formatCurrency(scenario.cost_usd)}</p>
            <p>Savings: {formatCurrency(scenario.savings_usd)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fixed model</p>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge value={scenario.fixed_model} kind="model" />
            <span className="text-xs text-slate-500">Baseline comparison</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Latency: {scenario.fixed_latency_ms} ms</p>
            <p>Cost: {formatCurrency(scenario.fixed_cost_usd)}</p>
            <p>Cost delta: {formatCurrency(costDelta)}</p>
            <p>Latency delta: {latencyDelta} ms faster</p>
          </div>
        </div>
      </div>
    </section>
  );
}
