"use client";

import { api, mockApi } from "@/lib/api";
import { mockMemory } from "@/lib/mock-data";
import { usePollingResource } from "@/hooks/use-polling-resource";
import { MemoryForm } from "@/components/dashboard/memory-form";
import { MemoryPreferencesPanel } from "@/components/dashboard/memory-preferences-panel";
import { SectionCard } from "@/components/shared/section-card";
import { SourceBanner } from "@/components/shared/source-banner";

export function MemoryView() {
  const memory = usePollingResource({
    fetcher: api.memory,
    fallback: mockApi.memory,
    initialData: mockMemory,
    interval: 15000
  });

  return (
    <div className="space-y-6 pb-8">
      <SourceBanner source={memory.source} error={memory.error} />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Current Memory Profile"
          description="Preferences fetched from GET /api/v1/memory and applied during AI generation"
        >
          <MemoryPreferencesPanel memory={memory.data} />
        </SectionCard>

        <SectionCard
          title="Update Memory Settings"
          description="Control tone, signature, and default behavior"
        >
          <MemoryForm initialValues={memory.data} source={memory.source} />
        </SectionCard>
      </div>
    </div>
  );
}
