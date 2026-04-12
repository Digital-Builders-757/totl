"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { createBillingPortalSession } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";
import {
  getSubscriptionStatusText,
  getSubscriptionStatusColor,
  getPlanDisplayName,
  isActiveSubscriber,
  needsSubscription,
  hasPaymentIssues,
} from "@/lib/subscription";
import { cn } from "@/lib/utils/utils";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type BillingProfile = Pick<
  Profile,
  | "role"
  | "subscription_status"
  | "subscription_plan"
  | "subscription_current_period_end"
  | "stripe_customer_id"
>;

interface BillingSettingsProps {
  profile: BillingProfile;
}

const glassCard =
  "panel-frosted min-w-0 border-white/10 bg-[var(--totl-surface-glass-strong)] text-white shadow-none";

export function BillingSettings({ profile }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(isActiveSubscriber(profile));

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      await createBillingPortalSession();
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      console.error("Billing portal error:", error);
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: Database["public"]["Enums"]["subscription_status"]) => {
    switch (status) {
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

  return (
    <div className="space-y-5 pb-20 sm:pb-0">
      <Card className={glassCard}>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            {getStatusIcon(profile.subscription_status)}
            Subscription snapshot
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Current status of your TOTL Agency subscription.
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
        </CardContent>
      </Card>

      {hasPaymentIssues(profile) && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-[var(--oklch-text-secondary)]">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription>
            Your payment is overdue. Update your payment method in the billing portal to keep premium
            access.
          </AlertDescription>
        </Alert>
      )}

      {needsSubscription(profile) && (
        <Alert className="border-white/10 bg-white/[0.04] text-[var(--oklch-text-secondary)]">
          <AlertCircle className="h-4 w-4 text-[var(--oklch-text-tertiary)]" />
          <AlertDescription>
            You don&apos;t have an active subscription. Subscribe to apply to gigs and unlock premium
            features.
          </AlertDescription>
        </Alert>
      )}

      <Card className={glassCard}>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <CreditCard className="h-5 w-5 text-[var(--oklch-accent)]" />
            Billing actions
          </CardTitle>
          <CardDescription className="text-[var(--oklch-text-secondary)]">
            Update payment methods, invoices, or your plan—handled securely by Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--oklch-text-secondary)]">
            {profile.stripe_customer_id
              ? "Open Stripe’s billing portal to manage cards, invoices, and plan changes."
              : "You haven’t subscribed yet. Choose a plan to get started."}
          </p>

          <p className="text-xs text-[var(--oklch-text-tertiary)]">
            You’ll be redirected to Stripe’s secure site. Nothing sensitive is stored in the browser.
          </p>
        </CardContent>
      </Card>

      <div className="panel-frosted rounded-xl border border-white/10 bg-[var(--totl-surface-glass-strong)] p-3">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between px-2 py-2 text-left text-white hover:bg-white/10"
          onClick={() => setShowPlanDetails((current) => !current)}
        >
          <span className="text-sm font-medium">
            {showPlanDetails ? "Hide plan details" : "Show plan details"}
          </span>
          {showPlanDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <p className="px-2 pt-1 text-xs text-[var(--oklch-text-tertiary)]">
          Expand when you want a refresher on what’s included.
        </p>
      </div>

      {showPlanDetails && isActiveSubscriber(profile) && (
        <Card className={glassCard}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold text-white">Premium features</CardTitle>
            <CardDescription className="text-[var(--oklch-text-secondary)]">
              Included with your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-[var(--oklch-text-secondary)]">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                Apply to unlimited gigs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                Full client details and contact information
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                Profile visible in client searches
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                Priority support
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-3 z-10 -mx-1 rounded-xl border border-white/10 bg-[var(--totl-surface-glass-strong)] p-3 backdrop-blur-md panel-frosted">
        {profile.stripe_customer_id ? (
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {isLoading ? "Opening…" : "Manage subscription"}
          </Button>
        ) : (
          <Button
            asChild
            className="w-full border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400"
          >
            <Link href={PATHS.TALENT_SUBSCRIBE}>Choose plan</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
