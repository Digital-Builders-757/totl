"use server";

import { redirect } from "next/navigation";

import { PATHS } from "@/lib/constants/routes";
import { logActionFailure } from "@/lib/errors/log-action-failure";
import { getAppUrl, stripe, STRIPE_PRICES } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export async function createTalentCheckoutSession(plan: 'monthly' | 'annual') {
  const supabase = await createSupabaseServer();
  
  // 1. Require authenticated talent user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    redirect(PATHS.LOGIN);
  }

  // 2. Get profile and verify role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, subscription_status, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logActionFailure("subscribe.checkout.profile", profileError, { userId: user.id });
    throw new Error("We couldn’t load your profile. Please try again.");
  }

  if (!profile || profile.role !== 'talent') {
    throw new Error("Subscriptions are only available for talent accounts.");
  }

  // 3. Check if already has active subscription
  if (profile.subscription_status === 'active') {
    redirect('/talent/settings/billing');
  }

  // 4. Create or get Stripe customer
  let customerId = profile.stripe_customer_id;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    
    customerId = customer.id;
    
    // Update profile with customer ID (using admin client)
    const adminSupabase = createSupabaseAdminClient();
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);

    if (updateError) {
      logActionFailure("subscribe.checkout.saveCustomer", updateError, { userId: user.id });
      throw new Error("We couldn’t set up billing. Please try again.");
    }
  }

  // 5. Create checkout session
  const priceId = plan === 'monthly' ? STRIPE_PRICES.MONTHLY : STRIPE_PRICES.ANNUAL;
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id, // Additional resolution strategy for webhook
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/talent/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/talent/subscribe/cancelled`,
    metadata: {
      supabase_user_id: user.id,
      plan: plan,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  if (!session.url) {
    logActionFailure("subscribe.checkout.stripe", new Error("missing session.url"), { userId: user.id });
    throw new Error("We couldn’t start checkout. Please try again.");
  }

  redirect(session.url);
}
