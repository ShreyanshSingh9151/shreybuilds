import { AlertTriangle } from "lucide-react";

export function SourceBanner({ source, error }: { source: "api" | "mock"; error?: string | null }) {
  if (source !== "mock") return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-800">Using demo data</p>
        <p className="mt-0.5 text-xs text-amber-700">
          Backend unavailable. Set <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">NEXT_PUBLIC_API_BASE_URL</code> to connect demo UI with the Go + OpenRouter backend.
          {error && <span className="text-amber-600"> ({error})</span>}
        </p>
      </div>
    </div>
  );
}
