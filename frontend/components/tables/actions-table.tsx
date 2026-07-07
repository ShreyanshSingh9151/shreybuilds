import type { ActionRecord } from "@/lib/types";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";

export function ActionsTable({ actions, compact = false }: { actions: ActionRecord[]; compact?: boolean }) {
  if (!actions.length) {
    return (
      <EmptyState
        title="No actions yet"
        message="Trigger summarize, reply, rewrite, or classify operations to see live AI activity."
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Action
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Provider
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Subject
            </th>
            {!compact && (
              <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Sender
              </th>
            )}
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Models
            </th>
            {!compact && (
              <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Cost
              </th>
            )}
            {!compact && (
              <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Savings
              </th>
            )}
            {!compact && (
              <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Latency
              </th>
            )}
            <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Time
            </th>
            {!compact && (
              <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Preview
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {actions.map((action) => (
            <tr key={action.id} className="transition-colors hover:bg-slate-50/50">
              <td className="whitespace-nowrap px-5 py-3">
                <StatusBadge value={action.action_type} kind="action" />
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <StatusBadge value={action.provider} kind="provider" />
              </td>
              <td className="max-w-[200px] truncate px-3 py-3 text-sm font-medium text-ink">
                {action.subject}
              </td>
              {!compact && (
                <td className="max-w-[160px] truncate px-3 py-3 text-sm text-slate-500">
                  {action.sender}
                </td>
              )}
              <td className="whitespace-nowrap px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <StatusBadge value={action.selected_model} kind="model" />
                  {action.selected_model !== action.routed_model && (
                    <>
                      <span className="text-slate-300">&rarr;</span>
                      <StatusBadge value={action.routed_model} kind="model" />
                    </>
                  )}
                </div>
              </td>
              {!compact && (
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600">
                  {formatCurrency(action.cost_estimate)}
                </td>
              )}
              {!compact && (
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-emerald-700">
                  {formatCurrency(action.cost_savings_usd || 0)}
                </td>
              )}
              {!compact && (
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600">
                  {action.latency_ms}ms
                </td>
              )}
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                {formatDateTime(action.timestamp)}
              </td>
              {!compact && (
                <td className="max-w-[220px] truncate px-3 py-3 text-xs text-slate-500">
                  <p className="truncate">{action.result_preview}</p>
                  {action.route_reason && <p className="mt-1 truncate text-[11px] text-slate-400">Route: {action.route_reason}</p>}
                  {(action.confidence || action.action_items_count) && (
                    <p className="mt-1 truncate text-[11px] text-slate-400">
                      {action.confidence ? `Conf ${Math.round(action.confidence * 100)}%` : ""}
                      {action.confidence && action.action_items_count ? " · " : ""}
                      {action.action_items_count ? `${formatNumber(action.action_items_count)} items` : ""}
                    </p>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
