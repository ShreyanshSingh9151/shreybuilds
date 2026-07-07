"use client";

import { Coins, Inbox, MailWarning, MessageSquareReply, Route, Sparkles, Timer, Wallet } from "lucide-react";
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
import { api, mockApi } from "@/lib/api";
import { mockActions, mockEmails, mockInboxes, mockMemory, mockSummary } from "@/lib/mock-data";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/utils";
import { usePollingResource } from "@/hooks/use-polling-resource";
import { InboxesPanel } from "@/components/dashboard/inboxes-panel";
import { MemoryPreferencesPanel } from "@/components/dashboard/memory-preferences-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SectionCard } from "@/components/shared/section-card";
import { SourceBanner } from "@/components/shared/source-banner";
import { ActionsTable } from "@/components/tables/actions-table";
import { EmailsTable } from "@/components/tables/emails-table";

export function DashboardView() {
  const summary = usePollingResource({ fetcher: api.summary, fallback: mockApi.summary, initialData: mockSummary });
  const actions = usePollingResource({ fetcher: api.actions, fallback: mockApi.actions, initialData: mockActions });
  const inboxes = usePollingResource({ fetcher: api.inboxes, fallback: mockApi.inboxes, initialData: mockInboxes });
  const emails = usePollingResource({ fetcher: api.recentEmails, fallback: mockApi.recentEmails, initialData: mockEmails });
  const memory = usePollingResource({ fetcher: api.memory, fallback: mockApi.memory, initialData: mockMemory, interval: 15000 });

  const allResources = [summary, actions, inboxes, emails, memory];
  const anyMock = allResources.some((r) => r.source === "mock");
  const firstError = allResources.find((r) => r.error)?.error;
  const initialLoading = allResources.some((r) => r.isLoading);

  const modelUsageData = Object.entries(summary.data.model_usage || {}).map(([model, count]) => ({ model: model.toUpperCase(), count }));
  const actionUsageData = Object.entries(summary.data.action_usage || {}).map(([action, count]) => ({ action, count }));
  const pieColors = ["#0f766e", "#2563eb", "#f97316", "#334155", "#14b8a6"];

  return (
    <div className="space-y-6 pb-8">
      <SourceBanner source={anyMock ? "mock" : "api"} error={firstError} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {initialLoading ? (
          Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} className="h-[120px]" />)
        ) : (
          <>
            <StatCard title="Connected Inboxes" value={String(summary.data.connected_inboxes)} helper="Gmail + Outlook" icon={Inbox} />
            <StatCard title="Unread Emails" value={formatNumber(summary.data.unread_count)} helper="Needs AI triage" icon={MailWarning} />
            <StatCard title="Pending Replies" value={formatNumber(summary.data.pending_replies)} helper="Drafts waiting review" icon={MessageSquareReply} />
            <StatCard title="AI Actions" value={formatNumber(summary.data.total_ai_actions)} helper="Classify, summarize, reply, rewrite" icon={Sparkles} />
            <StatCard title="Total Tokens" value={formatNumber(summary.data.total_tokens)} helper="OpenRouter token volume" icon={Route} />
            <StatCard title="Total Cost" value={formatCurrency(summary.data.total_cost_usd)} helper="Actual spend" icon={Coins} />
            <StatCard title="Avg Latency" value={`${summary.data.avg_latency_ms.toFixed(0)} ms`} helper="Per AI action" icon={Timer} />
            <StatCard
              title="Routing Savings"
              value={formatCompactCurrency(summary.data.cost_savings_usd)}
              helper={`Vs single-model baseline ${formatCurrency(summary.data.baseline_cost_usd)}`}
              icon={Wallet}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Model Routing Mix" description="Logical OpenRouter-backed profile usage">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modelUsageData} dataKey="count" nameKey="model" outerRadius={90} innerRadius={45}>
                  {modelUsageData.map((entry, index) => (
                    <Cell key={entry.model} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Action Distribution" description="Summarize, reply, rewrite, classify volume">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionUsageData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="action" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Recent AI Actions" description="Live OpenRouter-backed extension operations" noPadding>
          <ActionsTable actions={actions.data.slice(0, 6)} compact />
        </SectionCard>

        <SectionCard title="Connected Inboxes" description="Accounts used by extension">
          <InboxesPanel inboxes={inboxes.data} />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Recent Emails" description="Sample threads visible to extension" noPadding>
          <EmailsTable emails={emails.data} />
        </SectionCard>

        <SectionCard title="Memory Profile" description="How generated drafts are personalized">
          {memory.data ? (
            <MemoryPreferencesPanel memory={memory.data} />
          ) : (
            <EmptyState title="Memory unavailable" message="Waiting for memory service response." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
