import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { STRIPE_WEBHOOK_SECRET, stripe } from "@/lib/stripe";
import { mapStripeStatusToLocal } from "@/lib/subscription";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";

type SubscriptionPlan = 'monthly' | 'annual';
type StripeWebhookLedgerStatus = "processing" | "processed" | "failed" | "ignored" | "orphaned";

/**
 * Converts unknown error to LogContext for logger
 */
function toLogContext(err: unknown): { error: string; stack?: string } {
  if (err instanceof Error) return { error: err.message, stack: err.stack };
  if (typeof err === "string") return { error: err };
  try {
    return { error: JSON.stringify(err) };
  } catch {
    return { error: String(err) };
  }
}

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

function parseStripeSignatureTimestamp(signature: string | null): number | null {
  if (!signature) return null;
  const parts = signature.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("t=")) continue;
    const raw = trimmed.slice(2);
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
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
    logger.error("Webhook signature verification failed", err, {
      signaturePresent: Boolean(signature),
      signatureTimestamp: parseStripeSignatureTimestamp(signature),
      bodyLength: body.length,
      contentLengthHeader: req.headers.get("content-length"),
      contentType: req.headers.get("content-type"),
      userAgent: req.headers.get("user-agent"),
      stripeRequestId: req.headers.get("request-id"),
    });
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
          const result = await handleSubscriptionUpdate(supabase, subscription, event, ledgerContext.customerEmail);
          
          if (!result.success) {
            // checkout.session.completed MUST resolve to a profile (this is a bug if it doesn't)
            // Return 500 to retry until profile mapping is fixed
            await markStripeWebhookEventLedgerRow(supabase, {
              eventId: event.id,
              status: "failed",
              error: `Failed to process subscription update (checkout.session.completed): No profile found for customer ${ledgerContext.customerId}`,
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
        const result = await handleSubscriptionUpdate(supabase, subscription, event, ledgerContext.customerEmail);
        
        if (!result.success) {
          // Check if this is a retryable failure or truly orphaned
          const { data: ledgerRow, error: ledgerError } = await supabase
            .from("stripe_webhook_events")
            .select("attempt_count, livemode")
            .eq("event_id", event.id)
            .maybeSingle();

          if (ledgerError) {
            // If we can't read the ledger row, do NOT mark orphaned.
            // Return 500 so Stripe retries rather than silently dropping a live event.
            await markStripeWebhookEventLedgerRow(supabase, {
              eventId: event.id,
              status: "failed",
              error: `Failed to read webhook ledger row: ${ledgerError.message}`,
            });
            return NextResponse.json({ error: "Failed to process subscription update" }, { status: 500 });
          }

          const attemptCount = (ledgerRow?.attempt_count as number | undefined) ?? 0;
          const livemode = ledgerRow?.livemode ?? true;

          // If test mode or too many attempts, mark as orphaned and return 200
          if (!livemode || attemptCount >= 5) {
            await markStripeWebhookEventLedgerRow(supabase, {
              eventId: event.id,
              status: "orphaned",
              error: `No profile found for customer ${ledgerContext.customerId} after ${attemptCount} attempts`,
            });
            return NextResponse.json({ received: true, orphaned: true });
          }

          // Otherwise, retry (return 500)
          await markStripeWebhookEventLedgerRow(supabase, {
            eventId: event.id,
            status: "failed",
            error: `Failed to process subscription update (customer.subscription.*): No profile found for customer ${ledgerContext.customerId}`,
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

        // Use metadata-first resolution
        const resolved = await resolveProfileFromStripeEvent(supabase, event, customerId, ledgerContext.customerEmail);

        if (!resolved) {
          // Subscription deletion for non-existent profile is acceptable (user may have been deleted)
          // Mark as orphaned and return 200
          await markStripeWebhookEventLedgerRow(supabase, {
            eventId: event.id,
            status: "orphaned",
            error: `No profile found for deleted subscription customer ${customerId}`,
          });
          return NextResponse.json({ received: true, orphaned: true });
        }

        const { profile } = resolved;

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

    // CRITICAL: Only mark as "processed" AFTER all business logic succeeds
    // This ensures idempotency means "side effects applied", not just "event received"
    await markStripeWebhookEventLedgerRow(supabase, { eventId: event.id, status: "processed" });
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook handler error", error);
    const eventId = (event as Stripe.Event | undefined)?.id ?? null;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Always write last_error, even if ledger row doesn't exist yet (upsert pattern)
    if (eventId) {
      // Try to update existing row first
      const { error: updateError } = await supabase
        .from("stripe_webhook_events")
        .update({
          status: "failed",
          last_error: errorMessage,
          error: errorMessage,
        })
        .eq("event_id", eventId);

      // If row doesn't exist (shouldn't happen, but be safe), create it
      if (updateError) {
        const ledgerContext = extractLedgerContext(event as Stripe.Event);
        await supabase
          .from("stripe_webhook_events")
          .insert({
            event_id: eventId,
            type: ledgerContext.type,
            stripe_created: ledgerContext.stripeCreated,
            livemode: ledgerContext.livemode,
            status: "failed",
            last_error: errorMessage,
            error: errorMessage,
            customer_id: ledgerContext.customerId,
            subscription_id: ledgerContext.subscriptionId,
            checkout_session_id: ledgerContext.checkoutSessionId,
            customer_email: ledgerContext.customerEmail,
            attempt_count: 1,
          })
          .select()
          .single();
      }
    }

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
  customerEmail: string | null;
};

function extractLedgerContext(event: Stripe.Event): StripeWebhookLedgerContext {
  const stripeCreated = typeof event.created === "number" ? event.created : 0;
  let customerId: string | null = null;
  let subscriptionId: string | null = null;
  let checkoutSessionId: string | null = null;
  let customerEmail: string | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    checkoutSessionId = session.id ?? null;
    customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
    customerEmail = session.customer_details?.email ?? null;
  } else if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;
    subscriptionId = subscription.id ?? null;
    customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
    // Try to get customer email from expanded customer object
    if (subscription.customer && typeof subscription.customer === "object" && "email" in subscription.customer) {
      customerEmail = (subscription.customer as Stripe.Customer).email ?? null;
    }
  } else if (event.type.startsWith("invoice.")) {
    const invoice = event.data.object as Stripe.Invoice;
    customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
    customerEmail = invoice.customer_email ?? null;
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
    customerEmail,
  };
}

async function insertStripeWebhookEventLedgerRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  context: StripeWebhookLedgerContext
): Promise<{ shouldShortCircuit: boolean; inFlight: boolean; error: unknown | null }> {
  if (typeof context.stripeCreated !== "number" || Number.isNaN(context.stripeCreated)) {
    return { shouldShortCircuit: false, inFlight: false, error: new Error("Invalid Stripe event.created") };
  }

  // Try to insert new event (first attempt)
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
        customer_email: context.customerEmail,
        attempt_count: 1,
      }
    );

  if (!error) return { shouldShortCircuit: false, inFlight: false, error: null };

  // PostgREST propagates unique violations as SQLSTATE 23505.
  // This means the event already exists (duplicate delivery or retry).
  const maybeAny = error as { code?: string; message?: string } | null;
  if (maybeAny?.code === "23505") {
    const { data: existing, error: readError } = await supabase
      .from("stripe_webhook_events")
      .select("status, attempt_count")
      .eq("event_id", context.eventId)
      .maybeSingle();

    if (readError) {
      logger.error("Failed to read existing Stripe webhook ledger row", readError);
      return { shouldShortCircuit: false, inFlight: false, error: readError };
    }

    const existingStatus = (existing as { status?: string } | null)?.status;
    const existingAttemptCount = ((existing as { attempt_count?: number } | null)?.attempt_count as number | undefined) ?? 0;

    // Terminal statuses: return 200 and don't retry
    const terminalStatuses = new Set(["processed", "ignored", "orphaned"] as const);
    if (existingStatus && terminalStatuses.has(existingStatus as "processed" | "ignored" | "orphaned")) {
      // Already processed/ignored/orphaned — short-circuit to avoid double side effects.
      return { shouldShortCircuit: true, inFlight: false, error: null };
    }

    if (existingStatus === "processing") {
      // Another request is already handling this event. Short-circuit to avoid double side effects.
      return { shouldShortCircuit: true, inFlight: true, error: null };
    }

    // Prior attempt is `failed` — increment attempt_count and re-mark as processing.
    // This ensures failed events get retried with proper attempt tracking.
    const attemptCount = existingAttemptCount + 1;

    await supabase
      .from("stripe_webhook_events")
      .update({ 
        status: "processing", 
        error: null,
        last_error: null,
        processed_at: null,
        attempt_count: attemptCount,
        customer_email: context.customerEmail, // Update email in case it's now available
      })
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
      last_error: args.error ?? null,
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

/**
 * Resolves a profile from Stripe event using metadata-first resolution strategy.
 * 
 * Resolution order:
 * 1. supabase_user_id from Stripe object metadata (subscription/checkout/customer)
 * 2. profiles.stripe_customer_id == customerId (fallback for subsequent events)
 * 3. Email matching (only if exactly one match and verified email)
 * 
 * Returns { profile, resolutionMethod } or null if not found.
 */
async function resolveProfileFromStripeEvent(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  event: Stripe.Event,
  customerId: string | null,
  _customerEmail: string | null
): Promise<{ profile: { id: string; subscription_plan: string | null }; resolutionMethod: string } | null> {
  if (!customerId) {
    return null;
  }

  // Strategy 1: Try metadata.supabase_user_id from subscription/checkout/customer objects
  let supabaseUserId: string | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // Try client_reference_id first (most reliable for checkout sessions)
    supabaseUserId = session.client_reference_id ?? null;
    // Fallback to metadata
    if (!supabaseUserId) {
      supabaseUserId = session.metadata?.supabase_user_id ?? null;
    }
    // Also check subscription metadata if available
    if (!supabaseUserId && session.subscription) {
      const subscriptionId = typeof session.subscription === "string" 
        ? session.subscription 
        : session.subscription.id;
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        supabaseUserId = subscription.metadata?.supabase_user_id ?? null;
      } catch (err) {
        logger.warn("Failed to retrieve subscription for metadata resolution", toLogContext(err));
      }
    }
  } else if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;
    supabaseUserId = subscription.metadata?.supabase_user_id ?? null;
    // Also check customer metadata if expanded
    if (!supabaseUserId && subscription.customer && typeof subscription.customer === "object") {
      const customer = subscription.customer as Stripe.Customer;
      supabaseUserId = customer.metadata?.supabase_user_id ?? null;
    }
  } else if (event.type.startsWith("invoice.")) {
    const invoice = event.data.object as Stripe.Invoice;
    // Invoices don't typically have supabase_user_id, but check subscription if available
    // Handle subscription field safely (can be string | Stripe.Subscription | null)
    // Use type assertion to access subscription field which may not be in all Stripe API versions
    const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
    const subscriptionId =
      typeof invoiceWithSubscription.subscription === "string"
        ? invoiceWithSubscription.subscription
        : invoiceWithSubscription.subscription?.id ?? null;

    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        supabaseUserId = subscription.metadata?.supabase_user_id ?? null;
      } catch (err) {
        logger.warn("Failed to retrieve subscription for invoice metadata resolution", toLogContext(err));
      }
    }
  }

  // Try resolving by supabase_user_id (fastest, most reliable)
  if (supabaseUserId) {
    const { data: profile, error: findError } = await supabase
      .from("profiles")
      .select("id, subscription_plan")
      .eq("id", supabaseUserId)
      .maybeSingle();

    if (findError) {
      logger.error("Error finding profile by supabase_user_id", findError);
    } else if (profile) {
      logger.info("Resolved profile via metadata.supabase_user_id", { 
        profileId: profile.id, 
        customerId 
      });
      return { profile, resolutionMethod: "metadata.supabase_user_id" };
    }
  }

  // Strategy 2: Fallback to stripe_customer_id lookup (normal path for subsequent events)
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, subscription_plan")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (findError) {
    logger.error("Error finding profile by stripe_customer_id", findError);
    return null;
  }

  if (profile) {
    logger.info("Resolved profile via stripe_customer_id", { 
      profileId: profile.id, 
      customerId 
    });
    return { profile, resolutionMethod: "stripe_customer_id" };
  }

  // Strategy 3: Email fallback (only if exactly one match and verified email)
  // Skip email fallback for now - requires careful validation to prevent false positives
  // Can be added later if needed with proper uniqueness checks

  return null;
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createSupabaseAdminClient>, 
  subscription: Stripe.Subscription,
  event: Stripe.Event,
  customerEmail: string | null
): Promise<{ success: boolean; profileId: string | null; resolutionMethod: string | null }> {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;

  if (!customerId) {
    logger.error("No customer ID found in subscription", undefined, { subscriptionId: subscription.id });
    return { success: false, profileId: null, resolutionMethod: null };
  }

  // Use metadata-first resolution
  const resolved = await resolveProfileFromStripeEvent(supabase, event, customerId, customerEmail);

  if (!resolved) {
    logger.error("No profile found for customer", undefined, { customerId });
    return { success: false, profileId: null, resolutionMethod: null };
  }

  const { profile, resolutionMethod } = resolved;

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
    logger.error("Error updating profile subscription", updateError);
    return { success: false, profileId: profile.id, resolutionMethod };
  }

  logger.info(`Successfully updated subscription for profile`, { 
    profileId: profile.id, 
    subscriptionStatus,
    resolutionMethod 
  });
  return { success: true, profileId: profile.id, resolutionMethod };
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
