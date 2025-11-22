import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionSuccessPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Welcome to TOTL Agency Premium!</CardTitle>
            <CardDescription className="text-base">
              Your subscription is now active. You can now access all premium features and apply to gigs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                What&apos;s unlocked:
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Apply to unlimited gigs</li>
                <li>• See full client details</li>
                <li>• Profile visible to clients</li>
                <li>• Priority support</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/talent/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/gigs">Browse Gigs</Link>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              You can manage your subscription anytime in your billing settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
