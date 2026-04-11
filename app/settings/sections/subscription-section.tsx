"use client";

import { CheckCircle, Clock, AlertCircle, CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS, PREFIXES } from "@/lib/constants/routes";
import {
  getSubscriptionStatusText,
  getSubscriptionStatusColor,
  getPlanDisplayName,
  isActiveSubscriber,
  needsSubscription,
} from "@/lib/subscription";
import { cn } from "@/lib/utils/utils";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type MinimalProfile = Pick<Profile, "role" | "subscription_status" | "subscription_plan" | "subscription_current_period_end">;

interface SubscriptionSectionProps {
  profile: MinimalProfile;
}

export function SubscriptionSection({ profile }: SubscriptionSectionProps) {
  // Only show for talent users
  if (profile.role !== "talent") {
    return null;
  }

  const getStatusIcon = () => {
    switch (profile.subscription_status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case "past_due":
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case "canceled":
      case "none":
        return <Clock className="h-4 w-4 text-[var(--oklch-text-tertiary)]" />;
      default:
        return <Clock className="h-4 w-4 text-[var(--oklch-text-tertiary)]" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          {getStatusIcon()}
          Subscription
        </CardTitle>
        <CardDescription className="text-[var(--oklch-text-secondary)]">
          Manage your TOTL Agency subscription to unlock premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">Status</span>
          <Badge
            variant="outline"
            className={cn("font-medium", getSubscriptionStatusColor(profile.subscription_status))}
          >
            {getSubscriptionStatusText(profile.subscription_status)}
          </Badge>
        </div>

        {profile.subscription_plan && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">Plan</span>
            <span className="text-sm text-white sm:text-right">
              {getPlanDisplayName(profile.subscription_plan)}
            </span>
          </div>
        )}

        {profile.subscription_current_period_end && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-[var(--oklch-text-secondary)]">
              {isActiveSubscriber(profile) ? "Next billing date" : "Ended on"}
            </span>
            <span className="text-sm text-white sm:text-right">
              {formatDate(profile.subscription_current_period_end)}
            </span>
          </div>
        )}

        <div className="border-t border-white/10 pt-4">
          {needsSubscription(profile) ? (
            <Button
              asChild
              className="w-full border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400"
            >
              <Link href={PATHS.TALENT_SUBSCRIBE}>
                <Star className="mr-2 h-4 w-4" />
                Subscribe now
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href={`${PREFIXES.TALENT_SETTINGS}/billing`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage subscription
              </Link>
            </Button>
          )}
        </div>

        {needsSubscription(profile) && (
          <div className="space-y-2 text-sm text-[var(--oklch-text-secondary)]">
            <p className="font-medium text-white">Premium includes</p>
            <ul className="ml-1 list-inside list-disc space-y-1 marker:text-[var(--oklch-text-tertiary)]">
              <li>Apply to unlimited gigs</li>
              <li>Full client details and contact info</li>
              <li>Profile visible in client searches</li>
              <li>Priority support</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

