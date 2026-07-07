"use client";

import type { BenchmarkScenario } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Props = {
  scenarios: BenchmarkScenario[];
};

export function EvaluationCharts({ scenarios }: Props) {
  const providerData = scenarios.reduce<Record<string, { name: string; value: number }>>((acc, scenario) => {
    const key = scenario.provider.toUpperCase();
    acc[key] = acc[key] || { name: key, value: 0 };
    acc[key].value += 1;
    return acc;
  }, {});

  const actionData = scenarios.reduce<Record<string, { action: string; savings: number }>>((acc, scenario) => {
    acc[scenario.action_type] = acc[scenario.action_type] || { action: scenario.action_type, savings: 0 };
    acc[scenario.action_type].savings += scenario.savings_usd;
    return acc;
  }, {});

  const latencyData = scenarios.map((scenario) => ({
    subject: scenario.subject.slice(0, 18) + (scenario.subject.length > 18 ? "…" : ""),
    latency: scenario.latency_ms,
    cost: scenario.cost_usd
  }));

  const providerChart = Object.values(providerData);
  const actionChart = Object.values(actionData);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="card-elevated overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Provider Coverage</h3>
          <p className="mt-0.5 text-xs text-slate-500">Gmail vs Outlook Web benchmark mix</p>
        </div>
        <div className="h-[280px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={providerChart} dataKey="value" nameKey="name" outerRadius={92} innerRadius={46}>
                {providerChart.map((entry, index) => (
                  <Cell key={entry.name} fill={["#0f766e", "#2563eb", "#f97316"][index % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-elevated overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Savings by Action</h3>
          <p className="mt-0.5 text-xs text-slate-500">Routing savings grouped by summarize/reply/rewrite/classify</p>
        </div>
        <div className="h-[280px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actionChart} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="action" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="savings" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card-elevated overflow-hidden xl:col-span-2">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Latency vs Cost</h3>
          <p className="mt-0.5 text-xs text-slate-500">Each benchmark email plotted against routed latency and cost</p>
        </div>
        <div className="h-[320px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latencyData} margin={{ top: 8, right: 12, left: -16, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} angle={-18} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="latency" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="cost" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
