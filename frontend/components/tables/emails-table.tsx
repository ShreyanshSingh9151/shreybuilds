import type { RecentEmail } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CheckCircle, Clock } from "lucide-react";

export function EmailsTable({ emails }: { emails: RecentEmail[] }) {
  if (!emails.length) {
    return (
      <EmptyState
        title="No processed emails"
        message="Recent inbox items will appear here after the backend processes incoming mail."
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[920px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Subject
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Sender
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Provider
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Category
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Priority
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Received
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {emails.map((email) => (
            <tr key={email.id} className="transition-colors hover:bg-slate-50/50">
              <td className="max-w-[220px] truncate px-5 py-3">
                <div className="flex items-center gap-2">
                  {!email.is_read && (
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                  <span className="truncate text-sm font-medium text-ink">{email.subject}</span>
                </div>
              </td>
              <td className="max-w-[160px] truncate px-3 py-3 text-sm text-slate-500">
                {email.sender}
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <StatusBadge value={email.provider} kind="provider" />
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <StatusBadge value={email.category} kind="action" />
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <StatusBadge value={email.priority} kind="priority" />
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                {email.ai_processed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Processed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    Queued
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                {formatDateTime(email.received_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
