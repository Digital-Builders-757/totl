"use client";

import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Clock, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { createBillingPortalSession } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isRedirectError } from "@/lib/is-redirect-error";
import { 
  getSubscriptionStatusText, 
  getSubscriptionStatusColor, 
  getPlanDisplayName,
  isActiveSubscriber,
  needsSubscription,
  hasPaymentIssues
} from "@/lib/subscription";
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
      console.error('Billing portal error:', error);
      setIsLoading(false);
      // You could add toast notification here
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: Database['public']['Enums']['subscription_status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'canceled':
      case 'none':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-5 pb-20 sm:pb-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(profile.subscription_status)}
            Subscription Snapshot
          </CardTitle>
          <CardDescription>
            Current status of your TOTL Agency subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge 
              variant={isActiveSubscriber(profile) ? "default" : "secondary"}
              className={getSubscriptionStatusColor(profile.subscription_status)}
            >
              {getSubscriptionStatusText(profile.subscription_status)}
            </Badge>
          </div>
          
          {profile.subscription_plan && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Plan:</span>
              <span>{getPlanDisplayName(profile.subscription_plan)}</span>
            </div>
          )}
          
          {profile.subscription_current_period_end && (
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {isActiveSubscriber(profile) ? 'Next billing date:' : 'Ended on:'}
              </span>
              <span>{formatDate(profile.subscription_current_period_end)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status-specific alerts */}
      {hasPaymentIssues(profile) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your payment is overdue. Please update your payment method to continue accessing premium features.
          </AlertDescription>
        </Alert>
      )}

      {needsSubscription(profile) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
              You don&apos;t have an active subscription. Subscribe to apply to gigs and access all premium features.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Actions
          </CardTitle>
          <CardDescription>
            Update your payment method, change plans, or cancel your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {profile.stripe_customer_id
              ? "Open Stripe's secure billing portal to manage cards, invoices, and plan changes."
              : "You haven't subscribed yet. Choose a plan to get started."}
          </p>
          
          <p className="text-xs text-muted-foreground">
            You&apos;ll be redirected to Stripe&apos;s secure billing portal where you can update your payment method, 
            download invoices, and manage your subscription.
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-gray-700/80 bg-gray-900/50 p-3">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between px-2 py-2 text-left text-gray-100 hover:bg-gray-800/80"
          onClick={() => setShowPlanDetails((current) => !current)}
        >
          <span>{showPlanDetails ? "Hide plan details" : "Show plan details"}</span>
          {showPlanDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <p className="px-2 pt-1 text-xs text-gray-400">
          Expand this section only when you need feature-level details.
        </p>
      </div>

      {showPlanDetails && isActiveSubscriber(profile) && (
        <Card>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
            <CardDescription>
                What&apos;s included in your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Apply to unlimited gigs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                See full client details and contact information
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Profile visible in client searches
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Priority support and faster responses
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-3 z-10 -mx-1 rounded-xl border border-gray-700 bg-black/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        {profile.stripe_customer_id ? (
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {isLoading ? 'Opening...' : 'Manage Subscription'}
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/talent/subscribe">
              Choose Plan
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
