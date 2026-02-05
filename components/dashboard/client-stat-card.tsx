import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";

interface ClientStatCardProps {
  title: string;
  icon: ReactNode;
  badgeLabel: string;
  value: ReactNode;
  footerLabel: string;
  footerActionText: string;
  footerActionHref: string;
  className?: string;
}

export function ClientStatCard({
  title,
  icon,
  badgeLabel,
  value,
  footerLabel,
  footerActionText,
  footerActionHref,
  className,
}: ClientStatCardProps) {
  return (
    <div className="totl-border-violet totl-hover-glow">
      <Card className={cn("totl-border-violet-inner min-h-[160px] flex", className)}>
        <CardContent className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2 text-sm text-[var(--oklch-text-secondary)]">
              <span className="totl-icon-glow mt-[2px]">{icon}</span>
              <span className="min-w-0 font-medium leading-snug line-clamp-2">{title}</span>
            </div>
            <Badge
              variant="outline"
            className="status-chip shrink-0 whitespace-nowrap border-[var(--totl-violet-border)] px-2 py-1 text-[10px] leading-none"
            >
              {badgeLabel}
            </Badge>
          </div>

          <div className="text-3xl font-semibold leading-none tabular-nums text-[var(--oklch-text-primary)]">
            {value}
          </div>

          <div className="mt-auto flex items-start justify-between gap-2 text-xs text-[var(--oklch-text-tertiary)]">
            <span className="shrink-0">{footerLabel}</span>
            <Link
              href={footerActionHref}
              className="min-w-0 text-right text-sm font-medium leading-snug text-[var(--oklch-text-primary)] hover:text-[var(--oklch-text-primary)]"
            >
              {footerActionText}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
