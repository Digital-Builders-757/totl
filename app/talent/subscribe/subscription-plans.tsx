"use client";

import { Check, Star } from "lucide-react";
import { useState } from "react";

import { createTalentCheckoutSession } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isRedirectError } from "@/lib/is-redirect-error";

export function SubscriptionPlans() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoadingPlan(plan);
    try {
      await createTalentCheckoutSession(plan);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      console.error('Subscription error:', error);
      setLoadingPlan(null);
      // You could add toast notification here
    }
  };

  const features = [
    "Apply to unlimited gigs",
    "See full client details and contact info",
    "Profile visible in client searches",
    "Priority support and faster responses",
    "Advanced portfolio analytics",
    "Direct messaging with clients",
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Monthly Plan */}
      <Card className="relative">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Monthly
            <Badge variant="outline">Flexible</Badge>
          </CardTitle>
          <CardDescription>Perfect for trying out the platform</CardDescription>
          <div className="text-3xl font-bold">
            $20<span className="text-lg font-normal text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <Button 
            onClick={() => handleSubscribe('monthly')}
            disabled={loadingPlan !== null}
            className="w-full"
            size="lg"
          >
            {loadingPlan === 'monthly' ? 'Processing...' : 'Start Monthly Plan'}
          </Button>
        </CardContent>
      </Card>

      {/* Annual Plan */}
      <Card className="relative border-primary shadow-lg">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <Star className="h-3 w-3 mr-1" />
            Best Value
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Annual
            <Badge variant="secondary">Save 17%</Badge>
          </CardTitle>
          <CardDescription>Most popular choice for serious talent</CardDescription>
          <div className="text-3xl font-bold">
            $200<span className="text-lg font-normal text-muted-foreground">/year</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="line-through">$240/year</span> • Save $40
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-primary">2 months free!</span>
            </li>
          </ul>
          <Button 
            onClick={() => handleSubscribe('annual')}
            disabled={loadingPlan !== null}
            className="w-full"
            size="lg"
          >
            {loadingPlan === 'annual' ? 'Processing...' : 'Start Annual Plan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
