"use client";

import { CheckCircle, Clock, AlertCircle, CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSubscriptionStatusText,
  getSubscriptionStatusColor,
  getPlanDisplayName,
  isActiveSubscriber,
  needsSubscription,
} from "@/lib/subscription";
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "past_due":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "canceled":
      case "none":
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {getStatusIcon()}
          Subscription Status
        </CardTitle>
        <CardDescription className="text-gray-400">
          Manage your TOTL Agency subscription to unlock premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 font-medium">Status:</span>
          <Badge
            variant={isActiveSubscriber(profile) ? "default" : "secondary"}
            className={getSubscriptionStatusColor(profile.subscription_status)}
          >
            {getSubscriptionStatusText(profile.subscription_status)}
          </Badge>
        </div>

        {profile.subscription_plan && (
          <div className="flex items-center justify-between">
            <span className="text-gray-300 font-medium">Plan:</span>
            <span className="text-white">{getPlanDisplayName(profile.subscription_plan)}</span>
          </div>
        )}

        {profile.subscription_current_period_end && (
          <div className="flex items-center justify-between">
            <span className="text-gray-300 font-medium">
              {isActiveSubscriber(profile) ? "Next billing date:" : "Ended on:"}
            </span>
            <span className="text-white">{formatDate(profile.subscription_current_period_end)}</span>
          </div>
        )}

        <div className="pt-2 border-t border-gray-700">
          {needsSubscription(profile) ? (
            <Button asChild className="w-full bg-white text-black hover:bg-gray-200">
              <Link href="/talent/subscribe">
                <Star className="h-4 w-4 mr-2" />
                Subscribe Now
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
              <Link href="/talent/settings/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Link>
            </Button>
          )}
        </div>

        {needsSubscription(profile) && (
          <div className="text-sm text-gray-400 space-y-1">
            <p className="font-medium text-gray-300">Premium features include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Apply to unlimited gigs</li>
              <li>See full client details and contact info</li>
              <li>Profile visible in client searches</li>
              <li>Priority support</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

