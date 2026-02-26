"use client";

import type { LucideIcon } from "lucide-react";

interface MobileSummaryItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

interface MobileSummaryRowProps {
  items: MobileSummaryItem[];
  className?: string;
}

export function MobileSummaryRow({ items, className }: MobileSummaryRowProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-gray-900/70 px-3 py-3 text-white ${className ?? ""}`.trim()}
    >
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-xs text-gray-300">
                {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" /> : null}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-sm font-semibold text-white">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

