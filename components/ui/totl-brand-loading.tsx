import type React from "react";

import {
  TotlAtmosphereShell,
  type TotlAmbientTone,
} from "@/components/ui/totl-atmosphere-shell";
import { cn } from "@/lib/utils/utils";

/** Slim indeterminate progress rail — no spinner; complements skeleton layouts. */
export function TotlBrandLoadingRail({
  className,
  label = "Loading",
}: {
  className?: string;
  /** Shown via aria-label only (localized per surface if needed). */
  label?: string;
}) {
  return (
    <div
      className={cn(
        "totl-brand-loading-rail h-[2px] w-full overflow-hidden rounded-full bg-white/[0.08]",
        className
      )}
      role="progressbar"
      aria-label={label}
      aria-busy="true"
    >
      <div className="totl-brand-loading-rail__bar h-full rounded-full shadow-[0_0_14px_rgba(196,181,253,0.35)]" />
    </div>
  );
}

export function TotlBrandLoadingRibbon({
  className,
  eyebrow,
  footline,
  rail = true,
  compact,
}: {
  className?: string;
  eyebrow?: string;
  rail?: boolean;
  footline?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-3", compact && "space-y-2", className)}>
      {eyebrow ? (
        <p className={cn(
          "text-[10px] font-medium uppercase tracking-[0.26em] text-[var(--totl-text-soft)] sm:text-[11px]",
          compact && "text-[10px]"
        )}
        >
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-[7px] w-[7px] shrink-0 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.75)]" />
          <p className={cn(
            "font-display text-xl font-semibold tracking-[-0.06em] text-white sm:text-2xl",
            compact && "text-lg sm:text-xl"
          )}
          >
            <span className="totl-text-gradient">TOTL</span>
            <span className="ml-2 text-[0.92em] font-medium tracking-normal text-white/85">Agency</span>
          </p>
        </div>
      </div>
      {footline ? (
        <p className={cn(
          "text-xs text-[var(--totl-text-soft)] sm:text-[13px]",
          compact && "text-[11px] sm:text-xs"
        )}
        >
          {footline}
        </p>
      ) : null}
      {rail ? <TotlBrandLoadingRail className="max-w-xl" /> : null}
    </div>
  );
}

/** Marketing/root loading: full atmospheric shell plus optional warm veil over content lane. */
export function TotlMarketingLoadingBackdrop({
  children,
  className,
  ambientTone = "default",
  grain = true,
  contentClassName,
}: {
  children: React.ReactNode;
  className?: string;
  ambientTone?: TotlAmbientTone;
  grain?: boolean;
  /** Extra classes on inner content stacking context (ribbon + skeleton live here). */
  contentClassName?: string;
}) {
  return (
    <TotlAtmosphereShell
      ambientTone={ambientTone}
      className={cn("text-white", grain && "grain-texture min-h-[100dvh]", className)}
      contentClassName={cn(
        "relative flex min-h-[100dvh] flex-col bg-transparent",
        contentClassName
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0 totl-brand-loading-warm-veil" aria-hidden />
      <div className="relative z-[3] flex min-h-0 flex-1 flex-col">{children}</div>
    </TotlAtmosphereShell>
  );
}
