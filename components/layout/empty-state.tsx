import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center panel-frosted card-backlit rounded-2xl border border-white/10 p-6 sm:p-8", className)}>
      {Icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
          <Icon className="h-6 w-6 text-[var(--oklch-text-secondary)]" aria-hidden="true" />
        </div>
      ) : null}

      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--oklch-text-primary)]">{title}</h3>
      {description ? <p className="mt-2 text-sm text-[var(--oklch-text-secondary)]">{description}</p> : null}

      {action ? (
        <div className="mt-6 flex justify-center">
          {action.href ? (
            <Button asChild className="button-glow">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} className="button-glow">
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

