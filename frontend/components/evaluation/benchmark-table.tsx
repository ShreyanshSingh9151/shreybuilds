"use client";

import type { BenchmarkScenario } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

type Props = {
  scenarios: BenchmarkScenario[];
};

export function BenchmarkTable({ scenarios }: Props) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[1500px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Provider</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subject</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expected</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Routed</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Route Reason</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Latency</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tokens</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cost</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Baseline</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Savings</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {scenarios.map((scenario) => (
            <tr key={scenario.id} className="transition-colors hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <StatusBadge value={scenario.provider} kind="provider" />
                  <span className="text-[11px] text-slate-400">{scenario.sender}</span>
                </div>
              </td>
              <td className="max-w-[220px] px-4 py-3">
                <p className="truncate text-sm font-medium text-slate-900">{scenario.subject}</p>
                <p className="mt-1 text-[11px] text-slate-400">{scenario.result_preview}</p>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <StatusBadge value={scenario.action_type} kind="action" />
                  <div className="text-[11px] text-slate-500">{scenario.expected_category} · {scenario.expected_priority}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <StatusBadge value={scenario.routed_model} kind="model" />
                  <div className="text-[11px] text-slate-500">{scenario.actual_model}</div>
                </div>
              </td>
              <td className="max-w-[240px] px-4 py-3 text-xs text-slate-500">{scenario.route_reason}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{scenario.latency_ms} ms</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatNumber(scenario.tokens)}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatCurrency(scenario.cost_usd)}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{formatCurrency(scenario.baseline_cost_usd)}</td>
              <td className="px-4 py-3 font-mono text-xs text-emerald-700">{formatCurrency(scenario.savings_usd)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <StatusBadge value={scenario.passed ? "pass" : "fail"} kind={scenario.passed ? "status" : "priority"} />
                  <span className="text-[11px] text-slate-500">{Math.round(scenario.match_score * 100)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
