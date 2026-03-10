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
    <header className={cn("space-y-2", className)}>
      {breadcrumbs ? <div className="text-sm text-[var(--oklch-text-tertiary)]">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--oklch-text-primary)] sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-[var(--oklch-text-secondary)] sm:text-base">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

