import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { STRIPE_WEBHOOK_SECRET, stripe } from "@/lib/stripe";
import { mapStripeStatusToLocal } from "@/lib/subscription";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

type SubscriptionPlan = 'monthly' | 'annual';
type StripeWebhookLedgerStatus = "processing" | "processed" | "failed" | "ignored";

function isCanonicalPlan(value: unknown): value is SubscriptionPlan {
  return value === "monthly" || value === "annual";
}

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
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logger.error("No Stripe signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    const ledgerContext = extractLedgerContext(event);

    // 1) Idempotency proof: attempt to record the event first (unique event_id).
    const ledgerInsert = await insertStripeWebhookEventLedgerRow(supabase, ledgerContext);
    if (ledgerInsert.shouldShortCircuit) {
      // Already processed/ignored OR in-flight — respond 2xx so Stripe stops retrying this duplicate delivery.
      return NextResponse.json({ received: true, duplicate: true, in_flight: ledgerInsert.inFlight });
    }
    if (ledgerInsert.error) {
      // Truthful ACK: if we can't write the ledger, we cannot prove idempotency → force Stripe retry.
      return NextResponse.json({ error: "Failed to write webhook ledger" }, { status: 500 });
    }

    // 2) Record ignored-but-tracked events (contract: ignored events are still recorded).
    if (!isHandledEventType(event.type)) {
      await markStripeWebhookEventLedgerRow(supabase, {
        eventId: event.id,
        status: "ignored",
        error: `Unhandled event type: ${event.type}`,
      });
      return NextResponse.json({ received: true });
    }

    // 3) Out-of-order tolerance: do not allow older events to overwrite newer processed state.
    if (ledgerContext.customerId) {
      const latestProcessed = await getLatestProcessedStripeCreatedForCustomer(supabase, ledgerContext.customerId);
      if (typeof latestProcessed === "number" && ledgerContext.stripeCreated < latestProcessed) {
        await markStripeWebhookEventLedgerRow(supabase, {
          eventId: event.id,
          status: "ignored",
          error: `Out-of-order event ignored (stripe_created=${ledgerContext.stripeCreated} < latest_processed=${latestProcessed})`,
        });
        return NextResponse.json({ received: true, ignored: "out_of_order" });
      }
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info('Checkout session completed', { sessionId: session.id });
        
        // Handle subscription checkout completion
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id;
            
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const success = await handleSubscriptionUpdate(supabase, subscription);
          if (!success) {
            await markStripeWebhookEventLedgerRow(supabase, {
              eventId: event.id,
              status: "failed",
              error: "Failed to process subscription update (checkout.session.completed)",
            });
            return NextResponse.json({ error: "Failed to process subscription update" }, { status: 500 });
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        logger.info('Subscription updated', { subscriptionId: subscription.id, status: subscription.status });
        const success = await handleSubscriptionUpdate(supabase, subscription);
        if (!success) {
          await markStripeWebhookEventLedgerRow(supabase, {
            eventId: event.id,
            status: "failed",
            error: "Failed to process subscription update (customer.subscription.*)",
          });
          return NextResponse.json({ error: "Failed to process subscription update" }, { status: 500 });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        logger.info('Subscription deleted', { subscriptionId: subscription.id });
        
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;

        if (!customerId) {
          logger.error("No customer ID found for subscription deletion", undefined, { subscriptionId: subscription.id });
          await markStripeWebhookEventLedgerRow(supabase, {
            eventId: event.id,
            status: "failed",
            error: "No customer ID found for subscription deletion",
          });
          return NextResponse.json({ error: "Failed to process subscription deletion" }, { status: 500 });
        }

        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (findError) {
          logger.error("Error finding profile for deleted subscription", findError);
          await markStripeWebhookEventLedgerRow(supabase, {
            eventId: event.id,
            status: "failed",
            error: `Error finding profile for deleted subscription: ${findError.message}`,
          });
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
            logger.error("Error updating profile for deleted subscription", updateError);
            await markStripeWebhookEventLedgerRow(supabase, {
              eventId: event.id,
              status: "failed",
              error: `Error updating profile for deleted subscription: ${updateError.message}`,
            });
            return NextResponse.json({ error: "Failed to process subscription deletion" }, { status: 500 });
          }

          logger.info("Successfully canceled subscription for profile", { profileId: profile.id });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        logger.warn('Payment failed for invoice', { invoiceId: invoice.id });
        // Note: Subscription status will be updated via customer.subscription.updated event
        // when payment fails, so we don't need to handle it here
        break;
      }

      default:
        // This should be unreachable because we short-circuit unhandled events above,
        // but keep as a defense-in-depth fallback.
        logger.warn(`Unhandled event type: ${event.type}`);
    }

    await markStripeWebhookEventLedgerRow(supabase, { eventId: event.id, status: "processed" });
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook handler error", error);
    await markStripeWebhookEventLedgerRow(supabase, {
      eventId: (event as Stripe.Event | undefined)?.id ?? null,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown webhook handler error",
    });
    return NextResponse.json(
      { error: "Webhook handler failed" }, 
      { status: 500 }
    );
  }
}

function isHandledEventType(type: string): boolean {
  return (
    type === "checkout.session.completed" ||
    type === "customer.subscription.created" ||
    type === "customer.subscription.updated" ||
    type === "customer.subscription.deleted" ||
    type === "invoice.payment_failed"
  );
}

type StripeWebhookLedgerContext = {
  eventId: string;
  type: string;
  stripeCreated: number;
  livemode: boolean;
  customerId: string | null;
  subscriptionId: string | null;
  checkoutSessionId: string | null;
};

function extractLedgerContext(event: Stripe.Event): StripeWebhookLedgerContext {
  const stripeCreated = typeof event.created === "number" ? event.created : 0;
  let customerId: string | null = null;
  let subscriptionId: string | null = null;
  let checkoutSessionId: string | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    checkoutSessionId = session.id ?? null;
    customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  } else if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;
    subscriptionId = subscription.id ?? null;
    customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
  } else if (event.type.startsWith("invoice.")) {
    const invoice = event.data.object as Stripe.Invoice;
    customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
    // Some Stripe API versions/type defs do not expose invoice.subscription on the Invoice type.
    // We don't require it for idempotency/monotonic checks; customer_id is sufficient.
    subscriptionId = null;
  }

  return {
    eventId: event.id,
    type: event.type,
    stripeCreated,
    livemode: !!event.livemode,
    customerId,
    subscriptionId,
    checkoutSessionId,
  };
}

async function insertStripeWebhookEventLedgerRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  context: StripeWebhookLedgerContext
): Promise<{ shouldShortCircuit: boolean; inFlight: boolean; error: unknown | null }> {
  if (typeof context.stripeCreated !== "number" || Number.isNaN(context.stripeCreated)) {
    return { shouldShortCircuit: false, inFlight: false, error: new Error("Invalid Stripe event.created") };
  }

  const { error } = await supabase
    .from("stripe_webhook_events")
    .insert(
      {
        event_id: context.eventId,
        type: context.type,
        stripe_created: context.stripeCreated,
        livemode: context.livemode,
        status: "processing" as StripeWebhookLedgerStatus,
        customer_id: context.customerId,
        subscription_id: context.subscriptionId,
        checkout_session_id: context.checkoutSessionId,
      }
    );

  if (!error) return { shouldShortCircuit: false, inFlight: false, error: null };

  // PostgREST propagates unique violations as SQLSTATE 23505.
  // If we've already processed the event, short-circuit. If the prior attempt failed,
  // allow Stripe to retry (truthful ACK behavior).
  const maybeAny = error as { code?: string; message?: string } | null;
  if (maybeAny?.code === "23505") {
    const { data: existing, error: readError } = await supabase
      .from("stripe_webhook_events")
      .select("status")
      .eq("event_id", context.eventId)
      .maybeSingle();

    if (readError) {
      logger.error("Failed to read existing Stripe webhook ledger row", readError);
      return { shouldShortCircuit: false, inFlight: false, error: readError };
    }

    const existingStatus = (existing as { status?: string } | null)?.status;
    if (existingStatus === "processed" || existingStatus === "ignored") {
      return { shouldShortCircuit: true, inFlight: false, error: null };
    }

    if (existingStatus === "processing") {
      // Another request is already handling this event. Short-circuit to avoid double side effects.
      return { shouldShortCircuit: true, inFlight: true, error: null };
    }

    // Prior attempt is `failed` (or unknown) — re-mark as processing and proceed.
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "processing", error: null, processed_at: null })
      .eq("event_id", context.eventId);

    return { shouldShortCircuit: false, inFlight: false, error: null };
  }

  logger.error("Failed to insert Stripe webhook ledger row", error);
  return { shouldShortCircuit: false, inFlight: false, error };
}

async function markStripeWebhookEventLedgerRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  args: { eventId: string | null; status: StripeWebhookLedgerStatus; error?: string }
): Promise<void> {
  if (!args.eventId) return;
  const processedAt = args.status === "processing" ? null : new Date().toISOString();
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: args.status,
      error: args.error ?? null,
      processed_at: processedAt,
    })
    .eq("event_id", args.eventId);

  if (error) {
    logger.error("Failed to update Stripe webhook ledger row", error);
  }
}

async function getLatestProcessedStripeCreatedForCustomer(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  customerId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .select("stripe_created")
    .eq("customer_id", customerId)
    .eq("status", "processed")
    .order("stripe_created", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("Failed to read latest processed Stripe event for customer", error);
    return null;
  }

  const stripeCreated = data?.stripe_created;
  return typeof stripeCreated === "number" ? stripeCreated : null;
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createSupabaseAdminClient>, 
  subscription: Stripe.Subscription
): Promise<boolean> {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;

  if (!customerId) {
    logger.error("No customer ID found in subscription", undefined, { subscriptionId: subscription.id });
    return false;
  }

  // Find user by customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, subscription_plan")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (findError) {
    logger.error("Error finding profile for subscription update", findError);
    return false;
  }

  if (!profile) {
    logger.error("No profile found for customer", undefined, { customerId });
    return false;
  }

  // Map Stripe status to our enum
  const subscriptionStatus = mapStripeStatusToLocal(subscription.status);

  // Determine plan from price ID or metadata
  const plan = determinePlanFromSubscription(subscription);
  if (!plan) {
    logger.warn("Unable to determine subscription plan for subscription", {
      subscriptionId: subscription.id,
      priceIds: subscription.items?.data.map(item => item.price?.id),
      metadataPlan: subscription.metadata?.plan,
    });
  }

  // Update profile
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  // Guardrail: keep `profiles.subscription_plan` normalized to 'monthly' | 'annual' (never persist price IDs).
  const existingPlan = isCanonicalPlan(profile.subscription_plan) ? profile.subscription_plan : null;
  const planToPersist = plan ?? existingPlan ?? null;

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

  logger.info(`Successfully updated subscription for profile`, { profileId: profile.id, subscriptionStatus });
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
