import type React from "react";

import { cn } from "@/lib/utils/utils";

export interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Inner padding for content. Defaults to mobile-first.
   * Use `p-0` when the child controls padding (e.g. tables).
   */
  paddingClassName?: string;
}

export function SectionCard({ children, className, paddingClassName = "p-4 sm:p-6" }: SectionCardProps) {
  return (
    <section
      className={cn(
        "panel-frosted card-backlit grain-texture relative overflow-hidden rounded-2xl border border-white/10",
        className
      )}
    >
      <div className={cn("relative z-10", paddingClassName)}>{children}</div>
    </section>
  );
}

