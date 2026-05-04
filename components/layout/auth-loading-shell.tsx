import type React from "react";

import { PageShell } from "@/components/layout/page-shell";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { TotlBrandLoadingRibbon } from "@/components/ui/totl-brand-loading";
import { cn } from "@/lib/utils/utils";

export interface AuthLoadingShellProps {
  children: React.ReactNode;
  /** Merged onto `PageShell` outer class. */
  className?: string;
  /** Content wrapper (`relative z-10`): use for `container mx-auto px-4 …` like `AuthEntryShell`. */
  innerClassName?: string;
  showBrandRibbon?: boolean;
  /** Passed through when ribbon is visible. */
  ribbonFootline?: string;
  ribbonEyebrow?: string;
  ribbonCompact?: boolean;
  ribbonRail?: boolean;
}

/** Shared atmospheric wrapper for `/login`, signup, and recovery route `loading.tsx` trees. */
export function AuthLoadingShell({
  children,
  className,
  innerClassName,
  showBrandRibbon = true,
  ribbonEyebrow = "TOTL Agency",
  ribbonFootline = "Preparing your session…",
  ribbonCompact = true,
  ribbonRail = true,
}: AuthLoadingShellProps) {
  return (
    <PageShell
      fullBleed
      className={cn(
        "grain-texture glow-backplate relative overflow-x-hidden text-white",
        className
      )}
    >
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />

      <div className={cn("relative z-10", innerClassName)}>
        {showBrandRibbon ? (
          <div className="container mx-auto px-4 pt-5 sm:px-6 sm:pt-6 md:pt-7 lg:px-8">
            <TotlBrandLoadingRibbon
              compact={ribbonCompact}
              rail={ribbonRail}
              eyebrow={ribbonEyebrow}
              footline={ribbonFootline}
              className="pb-5 sm:pb-6"
            />
          </div>
        ) : null}
        {children}
      </div>
    </PageShell>
  );
}
