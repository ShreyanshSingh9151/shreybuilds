import type { Inbox } from "@/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Mail, Inbox as InboxIcon } from "lucide-react";

const providerIcons: Record<string, { icon: typeof Mail; color: string }> = {
  gmail: { icon: Mail, color: "text-red-500 bg-red-50" },
  outlook: { icon: InboxIcon, color: "text-blue-500 bg-blue-50" }
};

export function InboxesPanel({ inboxes }: { inboxes: Inbox[] }) {
  if (!inboxes.length) {
    return (
      <EmptyState
        title="No inboxes connected"
        message="Connect Gmail or Outlook to populate inbox analytics."
      />
    );
  }

  return (
    <div className="space-y-3">
      {inboxes.map((inbox) => {
        const provider = providerIcons[inbox.provider] ?? providerIcons.gmail!;
        const Icon = provider.icon;
        return (
          <div
            key={inbox.id}
            className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${provider.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">{inbox.display_name}</p>
                <StatusBadge value={inbox.provider} kind="provider" />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">{inbox.email}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {inbox.connected ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  Offline
                </span>
              )}
              <span className="text-xs text-slate-500">
                <span className="font-semibold text-ink">{inbox.unread_count}</span> unread
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
