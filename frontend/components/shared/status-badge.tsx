import { cn, titleCase } from "@/lib/utils";

type BadgeKind = "provider" | "model" | "action" | "priority" | "status";

type BadgeProps = {
  value: string;
  kind?: BadgeKind;
  className?: string;
};

const kindStyles: Record<BadgeKind, string> = {
  provider: "bg-blue-50 text-blue-700 ring-blue-600/10",
  model: "bg-teal-50 text-teal-700 ring-teal-600/10",
  action: "bg-amber-50 text-amber-700 ring-amber-600/10",
  priority: "bg-rose-50 text-rose-700 ring-rose-600/10",
  status: "bg-slate-50 text-slate-600 ring-slate-500/10"
};

const providerColors: Record<string, string> = {
  gmail: "bg-red-50 text-red-700 ring-red-600/10",
  outlook: "bg-blue-50 text-blue-700 ring-blue-600/10"
};

const modelColors: Record<string, string> = {
  gpt: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  claude: "bg-orange-50 text-orange-700 ring-orange-600/10",
  gemini: "bg-blue-50 text-blue-700 ring-blue-600/10",
  auto: "bg-violet-50 text-violet-700 ring-violet-600/10"
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-50 text-red-700 ring-red-600/10",
  high: "bg-orange-50 text-orange-700 ring-orange-600/10",
  medium: "bg-yellow-50 text-yellow-700 ring-yellow-600/10",
  low: "bg-slate-50 text-slate-600 ring-slate-500/10"
};

const actionColors: Record<string, string> = {
  summarize: "bg-purple-50 text-purple-700 ring-purple-600/10",
  reply: "bg-blue-50 text-blue-700 ring-blue-600/10",
  rewrite: "bg-amber-50 text-amber-700 ring-amber-600/10",
  classify: "bg-teal-50 text-teal-700 ring-teal-600/10"
};

function getStyles(value: string, kind: BadgeKind): string {
  const v = value.toLowerCase();
  switch (kind) {
    case "provider":
      return providerColors[v] ?? kindStyles.provider;
    case "model":
      return modelColors[v] ?? kindStyles.model;
    case "priority":
      return priorityColors[v] ?? kindStyles.priority;
    case "action":
      return actionColors[v] ?? kindStyles.action;
    default:
      return kindStyles.status;
  }
}

export function StatusBadge({ value, kind = "status", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        getStyles(value, kind),
        className
      )}
    >
      {kind === "model" ? value.toUpperCase() : titleCase(value)}
    </span>
  );
}
