"use client";

import type { BenchmarkScenario } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";

type Props = {
  scenarios: BenchmarkScenario[];
  provider: string;
  actionType: string;
  compareMode: boolean;
  onProviderChange: (value: string) => void;
  onActionTypeChange: (value: string) => void;
  onCompareModeChange: (value: boolean) => void;
};

export function EvaluationControls({
  scenarios,
  provider,
  actionType,
  compareMode,
  onProviderChange,
  onActionTypeChange,
  onCompareModeChange
}: Props) {
  const providerOptions = ["all", ...Array.from(new Set(scenarios.map((item) => item.provider)))];
  const actionOptions = ["all", ...Array.from(new Set(scenarios.map((item) => item.action_type)))];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {providerOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onProviderChange(option)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              provider === option
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option === "all" ? "All providers" : option.toUpperCase()}
          </button>
        ))}
        {actionOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onActionTypeChange(option)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              actionType === option
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option === "all" ? "All actions" : option}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <input
          type="checkbox"
          checked={compareMode}
          onChange={(event) => onCompareModeChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Compare Mode
        <StatusBadge value={compareMode ? "on" : "off"} kind="status" />
      </label>
    </div>
  );
}
