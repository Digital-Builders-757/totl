"use client";

import { Lock, Star, Zap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubscriptionPromptMessage } from "@/lib/gig-access";
import type { Database } from "@/types/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];
type MinimalProfile = Pick<Profile, "role" | "subscription_status"> & Partial<Profile>;

interface SubscriptionPromptProps {
  profile: MinimalProfile | null;
  variant?: 'banner' | 'card' | 'inline';
  context?: 'gig-apply' | 'gig-details' | 'general';
}

export function SubscriptionPrompt({ 
  profile, 
  variant = 'banner',
  context = 'general' 
}: SubscriptionPromptProps) {
  // Don't show for non-talent users or active subscribers
  if (!profile || profile.role !== 'talent' || profile.subscription_status === 'active') {
    return null;
  }

  const message = getSubscriptionPromptMessage(profile);
  
  const contextMessages = {
    'gig-apply': 'Subscribe to apply to this gig and thousands more',
    'gig-details': 'Subscribe to see full client details and apply',
    'general': message,
  };

  const displayMessage = contextMessages[context] || message;

  if (variant === 'banner') {
    return (
      <div
        className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6"
        data-testid="subscription-banner"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{displayMessage}</p>
              <p className="text-sm text-muted-foreground">
                Join thousands of talent getting booked through TOTL Agency
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/talent/subscribe">
              <Star className="h-4 w-4 mr-2" />
              Subscribe Now
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card
        className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
        data-testid="subscription-card"
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="secondary">Premium Feature</Badge>
          </div>
          <CardTitle className="text-lg">Unlock Full Access</CardTitle>
          <CardDescription>{displayMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">What you&apos;ll get:</p>
              <ul className="space-y-1">
                <li>• Apply to unlimited gigs</li>
                <li>• See full client details</li>
                <li>• Profile visible to clients</li>
                <li>• Priority support</li>
              </ul>
            </div>
            <Button asChild className="w-full">
              <Link href="/talent/subscribe">
                View Plans & Subscribe
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <div
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-primary/20"
      data-testid="subscription-inline"
    >
      <Lock className="h-4 w-4 text-primary flex-shrink-0" />
      <p className="text-sm text-muted-foreground flex-1">{displayMessage}</p>
      <Button size="sm" asChild>
        <Link href="/talent/subscribe">Subscribe</Link>
      </Button>
    </div>
  );
}
