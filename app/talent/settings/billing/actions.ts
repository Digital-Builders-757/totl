"use server";

import { redirect } from "next/navigation";

import { logActionFailure } from "@/lib/errors/log-action-failure";
import { getAppUrl, stripe } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function createBillingPortalSession() {
  const supabase = await createSupabaseServer();
  
  // 1. Require authenticated talent user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    redirect('/login');
  }

  // 2. Get profile and verify role + customer ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logActionFailure("billing.createPortalSession.profile", profileError, { userId: user.id });
    throw new Error("We couldn’t load your billing profile. Please try again.");
  }

  if (!profile || profile.role !== 'talent') {
    throw new Error("Billing is only available for talent accounts.");
  }

  if (!profile.stripe_customer_id) {
    throw new Error("Subscribe first to manage billing and payment methods.");
  }

  // 3. Create billing portal session
  const appUrl = getAppUrl();
  
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/talent/settings/billing`,
  });

  if (!session.url) {
    logActionFailure("billing.createPortalSession.stripe", new Error("missing session.url"), {
      userId: user.id,
    });
    throw new Error("We couldn’t open the billing portal. Please try again.");
  }

  redirect(session.url);
}
