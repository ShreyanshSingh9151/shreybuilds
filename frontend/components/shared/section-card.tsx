import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
};

export function SectionCard({ title, description, action, children, className, noPadding }: SectionCardProps) {
  return (
    <section className={cn("card-elevated animate-fade-in overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </section>
  );
}
