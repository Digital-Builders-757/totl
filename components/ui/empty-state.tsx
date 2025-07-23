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
    <Card className={`text-center ${className}`}>
      <CardContent className="pt-6">
        {Icon && (
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <Icon className="h-12 w-12" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        {action && (
          <Button variant="outline" onClick={action.onClick} asChild={!!action.href}>
            {action.href ? <a href={action.href}>{action.label}</a> : action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
