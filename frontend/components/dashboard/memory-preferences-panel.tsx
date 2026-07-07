import type { MemoryPreferences } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { Clock } from "lucide-react";

export function MemoryPreferencesPanel({ memory }: { memory: MemoryPreferences }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <PreferenceItem label="User Name" value={memory.name} />
        <PreferenceItem label="Default Model">
          <StatusBadge value={memory.default_model} kind="model" />
        </PreferenceItem>
        <PreferenceItem label="Preferred Tone" value={memory.preferred_tone} capitalize />
        <PreferenceItem label="Client Tone" value={memory.tone_for_clients} capitalize />
        <PreferenceItem label="Internal Tone" value={memory.tone_for_internal} capitalize />
        <PreferenceItem label="Signature" value={memory.signature} multiline />
      </div>

      <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Reply Personalization Effect</p>
        <p className="mt-2 text-sm leading-relaxed text-teal-900">
          Reply generation uses default profile <strong>{memory.default_model.toUpperCase()}</strong>, tone fallback <strong>{memory.preferred_tone}</strong>,
          sender-aware tone switching (clients: <strong>{memory.tone_for_clients}</strong>, internal: <strong>{memory.tone_for_internal}</strong>),
          your signature, and custom instructions below.
        </p>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Custom Instructions</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {memory.common_instructions || "No custom instructions set."}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="h-3 w-3" />
        Updated {formatDateTime(memory.updated_at)}
      </div>
    </div>
  );
}

function PreferenceItem({
  label,
  value,
  multiline,
  capitalize,
  children
}: {
  label: string;
  value?: string;
  multiline?: boolean;
  capitalize?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1.5">
        {children ?? (
          <p className={`text-sm text-ink ${multiline ? "whitespace-pre-wrap leading-relaxed" : "font-medium"} ${capitalize ? "capitalize" : ""}`}>
            {value || "-"}
          </p>
        )}
      </div>
    </div>
  );
}
