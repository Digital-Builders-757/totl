import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { mapStripeStatusToLocal } from "@/lib/subscription";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
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
          await handleSubscriptionUpdate(supabase, subscription);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);
        
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;

        if (customerId) {
          const { data: profile, error: findError } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (findError) {
            console.error("Error finding profile for deleted subscription:", findError);
            break;
          }

          if (profile) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                subscription_status: 'canceled',
                stripe_subscription_id: null,
                subscription_current_period_end: null,
              })
              .eq("id", profile.id);

            if (updateError) {
              console.error("Error updating profile for deleted subscription:", updateError);
            } else {
              console.log("Successfully canceled subscription for profile:", profile.id);
            }
          }
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
) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;

  if (!customerId) {
    console.error("No customer ID found in subscription:", subscription.id);
    return;
  }

  // Find user by customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (findError) {
    console.error("Error finding profile for subscription update:", findError);
    return;
  }

  if (!profile) {
    console.error("No profile found for customer:", customerId);
    return;
  }

  // Map Stripe status to our enum
  const subscriptionStatus = mapStripeStatusToLocal(subscription.status);

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  let plan = 'monthly';
  if (priceId === process.env.STRIPE_PRICE_TALENT_ANNUAL) {
    plan = 'annual';
  }

  // Update profile
  // Access current_period_end safely - Stripe subscription has this property
  const currentPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscription.id,
      subscription_plan: plan,
      subscription_current_period_end: currentPeriodEnd 
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Error updating profile subscription:", updateError);
  } else {
    console.log(`Successfully updated subscription for profile ${profile.id}: ${subscriptionStatus}`);
  }
}
