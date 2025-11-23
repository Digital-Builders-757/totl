import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionCancelledPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-gray-600" />
            </div>
            <CardTitle className="text-2xl">Subscription Cancelled</CardTitle>
            <CardDescription className="text-base">
              Your payment was not completed. No charges have been made to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                You can still browse gigs and build your profile. Subscribe anytime to unlock premium features and start applying to gigs.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/talent/subscribe">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/talent/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
