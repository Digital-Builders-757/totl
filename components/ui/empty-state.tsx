"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`grain-texture text-center ${className}`}>
      <CardContent className="pt-6">
        {Icon && (
          <div className="mx-auto mb-4 h-12 w-12 text-[var(--oklch-text-muted)]">
            <Icon className="h-12 w-12" />
          </div>
        )}
        <h3 className="mb-2 text-sm font-semibold text-[var(--oklch-text-primary)]">{title}</h3>
        <p className="mb-4 text-sm text-[var(--oklch-text-secondary)]">{description}</p>
        {action &&
          (action.href ? (
            <Button variant="default" className="rounded-full font-semibold" asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button variant="default" className="rounded-full font-semibold" onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}
