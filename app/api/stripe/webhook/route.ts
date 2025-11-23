import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { STRIPE_WEBHOOK_SECRET, stripe } from "@/lib/stripe";
import { mapStripeStatusToLocal } from "@/lib/subscription";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

type SubscriptionPlan = 'monthly' | 'annual';

function determinePlanFromSubscription(subscription: Stripe.Subscription): SubscriptionPlan | null {
  const monthlyPriceId = process.env.STRIPE_PRICE_TALENT_MONTHLY;
  const annualPriceId = process.env.STRIPE_PRICE_TALENT_ANNUAL;

  for (const item of subscription.items?.data ?? []) {
    const priceId = item.price?.id;
    if (!priceId) continue;
    if (monthlyPriceId && priceId === monthlyPriceId) {
      return 'monthly';
    }
    if (annualPriceId && priceId === annualPriceId) {
      return 'annual';
    }
  }

  const metadataPlan = subscription.metadata?.plan;
  if (metadataPlan === 'monthly' || metadataPlan === 'annual') {
    return metadataPlan;
  }

  return null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("No Stripe signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        // Handle subscription checkout completion
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id;
            
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const success = await handleSubscriptionUpdate(supabase, subscription);
          if (!success) {
            return NextResponse.json({ error: "Failed to process subscription update" }, { status: 500 });
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        const success = await handleSubscriptionUpdate(supabase, subscription);
        if (!success) {
          return NextResponse.json({ error: "Failed to process subscription update" }, { status: 500 });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);
        
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;

        if (!customerId) {
          console.error("No customer ID found for subscription deletion:", subscription.id);
          return NextResponse.json({ error: "Failed to process subscription deletion" }, { status: 500 });
        }

        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (findError) {
          console.error("Error finding profile for deleted subscription:", findError);
          return NextResponse.json({ error: "Failed to process subscription deletion" }, { status: 500 });
        }

        if (profile) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_status: 'canceled',
              stripe_subscription_id: null,
              subscription_plan: null,
              subscription_current_period_end: null,
            })
            .eq("id", profile.id);

          if (updateError) {
            console.error("Error updating profile for deleted subscription:", updateError);
            return NextResponse.json({ error: "Failed to process subscription deletion" }, { status: 500 });
          }

          console.log("Successfully canceled subscription for profile:", profile.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for invoice:', invoice.id);
        // Note: Subscription status will be updated via customer.subscription.updated event
        // when payment fails, so we don't need to handle it here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" }, 
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createSupabaseAdminClient>, 
  subscription: Stripe.Subscription
): Promise<boolean> {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;

  if (!customerId) {
    console.error("No customer ID found in subscription:", subscription.id);
    return false;
  }

  // Find user by customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, subscription_plan")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (findError) {
    console.error("Error finding profile for subscription update:", findError);
    return false;
  }

  if (!profile) {
    console.error("No profile found for customer:", customerId);
    return false;
  }

  // Map Stripe status to our enum
  const subscriptionStatus = mapStripeStatusToLocal(subscription.status);

  // Determine plan from price ID or metadata
  const plan = determinePlanFromSubscription(subscription);
  if (!plan) {
    console.warn("Unable to determine subscription plan for subscription:", subscription.id, {
      priceIds: subscription.items?.data.map(item => item.price?.id),
      metadataPlan: subscription.metadata?.plan,
    });
  }

  // Update profile
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  const planToPersist = plan ?? profile.subscription_plan ?? null;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscription.id,
      subscription_plan: planToPersist,
      subscription_current_period_end: currentPeriodEnd,
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error updating profile subscription:", updateError);
    return false;
  }

  console.log(`Successfully updated subscription for profile ${profile.id}: ${subscriptionStatus}`);
  return true;
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const itemWithPeriodEnd = subscription.items?.data?.find((item) => {
    const candidate = item as Stripe.SubscriptionItem & { current_period_end?: number };
    return typeof candidate.current_period_end === "number";
  }) as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;

  const periodEndFromItem = itemWithPeriodEnd?.current_period_end;
  if (typeof periodEndFromItem === "number") {
    return new Date(periodEndFromItem * 1000).toISOString();
  }

  const legacyPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  if (typeof legacyPeriodEnd === "number") {
    return new Date(legacyPeriodEnd * 1000).toISOString();
  }

  return null;
}
