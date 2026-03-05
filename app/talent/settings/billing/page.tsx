import { redirect } from "next/navigation";

import { BillingSettings } from "./billing-settings";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
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
    <PageShell className="bg-black" containerClassName="max-w-3xl py-4 sm:py-6">
      <div className="space-y-6">
        <PageHeader
          title="Billing Settings"
          subtitle="Manage your subscription, payment details, and premium access."
        />
        <BillingSettings profile={profile} />
      </div>
    </PageShell>
  );
}
