import { redirect } from "next/navigation";

import { SubscriptionPlans } from "./subscription-plans";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export default async function SubscribePage() {
  const supabase = await createSupabaseServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'talent') {
    redirect('/talent/dashboard');
  }

  // If already subscribed, redirect to billing
  if (profile.subscription_status === 'active') {
    redirect('/talent/settings/billing');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Subscribe to apply to gigs and access all premium features
          </p>
          <p className="text-muted-foreground">
            Join thousands of talent getting booked through TOTL Agency
          </p>
        </div>
        
        <SubscriptionPlans />
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Cancel anytime. No hidden fees. 30-day money-back guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
