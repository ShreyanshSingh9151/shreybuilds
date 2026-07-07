"use client";

import { api, mockApi } from "@/lib/api";
import { mockActions } from "@/lib/mock-data";
import { usePollingResource } from "@/hooks/use-polling-resource";
import { SectionCard } from "@/components/shared/section-card";
import { SourceBanner } from "@/components/shared/source-banner";
import { ActionsTable } from "@/components/tables/actions-table";

export function ActionsView() {
  const actions = usePollingResource({
    fetcher: api.actions,
    fallback: mockApi.actions,
    initialData: mockActions
  });

  return (
    <div className="space-y-6 pb-8">
      <SourceBanner source={actions.source} error={actions.error} />

      <SectionCard
        title="All Extension Actions"
        description="Live OpenRouter routing log for classify, summarize, reply, and rewrite"
        noPadding
      >
        <ActionsTable actions={actions.data} />
      </SectionCard>
    </div>
  );
}
