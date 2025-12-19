import type React from "react";

import { cn } from "@/lib/utils/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      {breadcrumbs ? <div className="text-sm text-[var(--oklch-text-tertiary)]">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--oklch-text-primary)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm sm:text-base text-[var(--oklch-text-secondary)]">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

