import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className = "h-24" }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />
  );
}
