"use server";

import { redirect } from "next/navigation";

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
    console.error('Error fetching profile:', profileError);
    throw new Error('Failed to fetch user profile');
  }

  if (!profile || profile.role !== 'talent') {
    throw new Error('Only talent users can access billing');
  }

  if (!profile.stripe_customer_id) {
    throw new Error('No Stripe customer found. Please subscribe first.');
  }

  // 3. Create billing portal session
  const appUrl = getAppUrl();
  
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/talent/settings/billing`,
  });

  if (!session.url) {
    throw new Error('Failed to create billing portal session');
  }

  redirect(session.url);
}
