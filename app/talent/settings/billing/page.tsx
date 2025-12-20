import { redirect } from "next/navigation";

import { BillingSettings } from "./billing-settings";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export default async function BillingPage() {
  const supabase = await createSupabaseServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, subscription_status, subscription_plan, subscription_current_period_end, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error loading profile for billing page:', profileError);
    redirect('/talent/dashboard');
  }

  if (!profile || profile.role !== 'talent') {
    redirect('/talent/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Billing Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>
        <BillingSettings profile={profile} />
      </div>
    </div>
  );
}
