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
    <div className={`rounded-xl border border-white/10 bg-gray-900/70 p-3 text-white ${className ?? ""}`.trim()}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold">{title}</p>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {subtitle ? <p className="truncate text-xs text-gray-300">{subtitle}</p> : null}
          <div className="space-y-1 pt-1">
            {meta.slice(0, 3).map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="w-24 text-gray-400">{item.label}</span>
                <span className="flex-1 text-right font-medium text-gray-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      {footer ? <div className="mt-3 border-t border-white/10 pt-2">{footer}</div> : null}
    </div>
  );
}

