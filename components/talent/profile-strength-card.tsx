"use client";

import { Globe, Phone, Plus, Settings, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface ProfileStrengthCardProps {
  /** Whether basic info (name, location) is incomplete */
  needsProfileCompletion: boolean;
  /** Completion percentage (e.g. 60 or 85) */
  completionPercent: number;
  /** Whether contact details (phone) are complete */
  contactComplete?: boolean;
  /** Whether portfolio has at least one item */
  portfolioComplete?: boolean;
}

const rowBadge = (ok: boolean) =>
  ok
    ? "border-[var(--oklch-border-alpha)] bg-[var(--oklch-success)]/15 text-[var(--oklch-success)]"
    : "border-[var(--oklch-border-alpha)] bg-[var(--oklch-error)]/12 text-[var(--oklch-error)]";

/**
 * Presentational, read-only Profile Strength card.
 * Renders completion status and links to Complete Profile / Settings.
 * No DB calls; all data passed via props.
 */
export function ProfileStrengthCard({
  needsProfileCompletion,
  completionPercent,
  contactComplete = true,
  portfolioComplete = true,
}: ProfileStrengthCardProps) {
  const basicInfoComplete = !needsProfileCompletion;

  return (
    <Card className="grain-texture">
      <CardHeader>
        <div className="card-header-row">
          <CardTitle className="flex items-center gap-2 font-display text-lg text-[var(--oklch-text-primary)] sm:text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--oklch-border-alpha)] bg-white/[0.06]">
              <User className="h-4 w-4 text-[var(--oklch-accent)]" />
            </span>
            Profile strength
          </CardTitle>
          <Badge variant="outline" className="status-chip">
            {needsProfileCompletion ? "Needs work" : "Strong"}
          </Badge>
        </div>
        <CardDescription className="text-[var(--oklch-text-secondary)]">
          Complete your profile to get better-matched opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-[var(--oklch-text-secondary)]">
            <span>Profile completion</span>
            <span className="font-medium tabular-nums text-[var(--oklch-text-primary)]">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2 bg-white/10" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-[var(--oklch-text-primary)]">
              <User className="h-4 w-4 shrink-0 text-[var(--oklch-text-muted)]" />
              <span className="truncate">Basic information</span>
            </span>
            <Badge variant="outline" className={`shrink-0 ${rowBadge(basicInfoComplete)}`}>
              {basicInfoComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-[var(--oklch-text-primary)]">
              <Phone className="h-4 w-4 shrink-0 text-[var(--oklch-text-muted)]" />
              <span className="truncate">Contact details</span>
            </span>
            <Badge variant="outline" className={`shrink-0 ${rowBadge(contactComplete)}`}>
              {contactComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-[var(--oklch-text-primary)]">
              <Globe className="h-4 w-4 shrink-0 text-[var(--oklch-text-muted)]" />
              <span className="truncate">Portfolio</span>
            </span>
            <Badge variant="outline" className={`shrink-0 ${rowBadge(portfolioComplete)}`}>
              {portfolioComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="default" className="flex-1 rounded-full font-semibold" asChild>
            <Link href="/talent/profile" className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Complete profile
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full border-border/50 font-semibold"
            asChild
          >
            <Link href="/settings" className="flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
