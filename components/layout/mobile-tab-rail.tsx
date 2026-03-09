"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/utils";

export interface MobileTabRailProps {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  edgeColorClassName?: string;
}

export function MobileTabRail({
  children,
  className,
  scrollClassName,
  edgeColorClassName = "from-black",
}: MobileTabRailProps) {
  return (
    <div className={cn("relative md:hidden", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r to-transparent",
          edgeColorClassName
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l to-transparent",
          edgeColorClassName
        )}
      />
      <div
        className={cn(
          "-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          scrollClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
