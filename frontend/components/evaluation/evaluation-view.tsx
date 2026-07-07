"use client";

import { useMemo, useState } from "react";
import { api, mockApi } from "@/lib/api";
import { usePollingResource } from "@/hooks/use-polling-resource";
import { mockEvaluationScenarios, mockEvaluationSummary } from "@/lib/mock-evaluation";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SourceBanner } from "@/components/shared/source-banner";
import { SectionCard } from "@/components/shared/section-card";
import { EvaluationControls } from "@/components/evaluation/evaluation-controls";
import { EvaluationKpis } from "@/components/evaluation/evaluation-kpis";
import { EvaluationCharts } from "@/components/evaluation/evaluation-charts";
import { BenchmarkTable } from "@/components/evaluation/benchmark-table";
import { ComparePanel } from "@/components/evaluation/compare-panel";
import type { BenchmarkScenario } from "@/lib/types";

function passesFilter(item: BenchmarkScenario, provider: string, actionType: string) {
  const providerOk = provider === "all" || item.provider === provider;
  const actionOk = actionType === "all" || item.action_type === actionType;
  return providerOk && actionOk;
}

export function EvaluationView() {
  const scenariosState = usePollingResource({
    fetcher: api.evaluationScenarios,
    fallback: mockApi.evaluationScenarios,
    initialData: mockEvaluationScenarios,
    interval: 20000
  });
  const summaryState = usePollingResource({
    fetcher: api.evaluationSummary,
    fallback: mockApi.evaluationSummary,
    initialData: mockEvaluationSummary,
    interval: 20000
  });

  const [provider, setProvider] = useState("all");
  const [actionType, setActionType] = useState("all");
  const [compareMode, setCompareMode] = useState(true);

  const scenarios = scenariosState.data;
  const filtered = useMemo(
    () => scenarios.filter((item) => passesFilter(item, provider, actionType)),
    [actionType, provider, scenarios]
  );

  const source = scenariosState.source === "mock" || summaryState.source === "mock" ? "mock" : "api";
  const error = scenariosState.error || summaryState.error;

  return (
    <div className="space-y-6 pb-8">
      <SourceBanner source={source} error={error} />

      {summaryState.isLoading ? <LoadingSkeleton className="h-[120px]" /> : <EvaluationKpis summary={summaryState.data} />}

      <SectionCard
        title="Bench Filters"
        description="Curated Gmail and Outlook Web scenarios with routing explanations"
      >
        <EvaluationControls
          scenarios={scenarios}
          provider={provider}
          actionType={actionType}
          compareMode={compareMode}
          onProviderChange={setProvider}
          onActionTypeChange={setActionType}
          onCompareModeChange={setCompareMode}
        />
      </SectionCard>

      <EvaluationCharts scenarios={filtered.length ? filtered : scenarios} />

      {compareMode && filtered[0] ? <ComparePanel scenario={filtered[0]} /> : null}

      <SectionCard title="Benchmark Results" description="Pass/fail, cost savings, and route reasoning">
        {filtered.length ? <BenchmarkTable scenarios={filtered} /> : <EmptyState title="No benchmark rows" message="Adjust filters to view benchmarks." />}
      </SectionCard>
    </div>
  );
}
