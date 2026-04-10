"use client";

import type { ReactNode } from "react";

interface MetaItem {
  label: string;
  value: string;
}

interface MobileListRowCardProps {
  title: string;
  subtitle?: string;
  meta: MetaItem[];
  badge?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function MobileListRowCard({
  title,
  subtitle,
  meta,
  badge,
  trailing,
  footer,
  className,
}: MobileListRowCardProps) {
  return (
    <div
      className={`panel-frosted rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-foreground shadow-sm ${className ?? ""}`.trim()}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold">{title}</p>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {subtitle ? <p className="truncate text-xs text-[var(--oklch-text-secondary)]">{subtitle}</p> : null}
          <div className="space-y-1 pt-1">
            {meta.slice(0, 3).map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="w-24 text-[var(--oklch-text-tertiary)]">{item.label}</span>
                <span className="flex-1 text-right font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      {footer ? <div className="mt-3 border-t border-border/35 pt-2">{footer}</div> : null}
    </div>
  );
}

