import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type React from "react";

import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { cn } from "@/lib/utils/utils";

export interface AuthEntryShellProps {
  children: React.ReactNode;
  /** Ignored when `omitBackLink` is true. */
  backHref?: string;
  backLabel?: string;
  /** Hide the top back link (e.g. account hold / suspended). */
  omitBackLink?: boolean;
  className?: string;
  /** Outer panel max width (default matches login / reset flows). */
  panelClassName?: string;
  panelPaddingClassName?: string;
}

/**
 * Full-bleed auth / recovery entry layout: ambient shell + frosted panel stack.
 * Use for password reset, email verification, and similar marketing-adjacent routes.
 */
export function AuthEntryShell({
  children,
  backHref = "/",
  backLabel = "Back",
  omitBackLink = false,
  className,
  panelClassName,
  panelPaddingClassName = "p-8",
}: AuthEntryShellProps) {
  return (
    <PageShell
      fullBleed
      className={cn(
        "grain-texture glow-backplate relative overflow-x-hidden overflow-y-auto text-white",
        className
      )}
    >
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />
      <div className="relative z-10 container mx-auto px-4 py-4 sm:px-6 sm:py-6 md:py-8 lg:px-8">
        {!omitBackLink ? (
          <Link
            href={backHref}
            className="focus-hint mb-4 inline-flex items-center text-gray-400 transition-colors hover:text-white sm:mb-6 md:mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        ) : null}
        <SectionCard
          className={cn("mx-auto max-w-md overflow-hidden", panelClassName)}
          paddingClassName={panelPaddingClassName}
        >
          {children}
        </SectionCard>
      </div>
    </PageShell>
  );
}
