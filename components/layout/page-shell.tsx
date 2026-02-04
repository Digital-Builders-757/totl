import type React from "react";

import { cn } from "@/lib/utils/utils";

export interface PageShellProps {
  children: React.ReactNode;
  /**
   * Applies standard top offset for the main navbar (non-admin surfaces).
   * Admin surfaces typically set this false because they use `AdminHeader` instead.
   */
  topPadding?: boolean;
  className?: string;
  containerClassName?: string;
  /**
   * Use when you want a full-bleed page (no `.container` wrapper).
   * Default is false (containerized pages).
   */
  fullBleed?: boolean;
}

export function PageShell({
  children,
  topPadding = true,
  className,
  containerClassName,
  fullBleed = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-[var(--oklch-bg)] text-[var(--oklch-text-primary)] page-ambient",
        topPadding && "pt-20 sm:pt-24",
        className
      )}
    >
      {fullBleed ? (
        children
      ) : (
        <div className={cn("container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10", containerClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}

