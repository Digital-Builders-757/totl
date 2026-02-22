# Stripe Webhooks Runbook

**Date:** December 20, 2025  
**Status:** ✅ CURRENT  
**Purpose:** Fast operational playbook for debugging Stripe webhook-driven subscription state in TOTL.

---

## Primary truth sources
- Contract: `docs/contracts/STRIPE_WEBHOOKS_CONTRACT.md`
- Webhook route: `app/api/stripe/webhook/route.ts`
- Ledger table: `public.stripe_webhook_events` (idempotency + proofs)
- Entitlement surface: `public.profiles.subscription_status` (+ related Stripe fields)

---

## Incident: “Stripe shows delivered but user is not upgraded”

### What to check
- **Ledger row exists** for the Stripe `event.id`:
  - `status = processed` → webhook claims it applied side effects; investigate downstream feature gating or data reads.
  - `status = failed` → webhook failed; Stripe should retry. Check `error`.
  - `status = ignored` → either unhandled event type or out-of-order prevention; check `error`.

### Likely causes
- Webhook failed DB update (see `error`) and is retrying.
- Event was **out-of-order** and ignored; a newer processed event is considered authoritative.
- Customer mapping missing (`profiles.stripe_customer_id` absent or wrong).

---

## Incident: “User claims active subscription but app shows inactive”

### What to check
- `public.profiles` for the user:
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `subscription_status`
  - `subscription_plan`
  - `subscription_current_period_end`

### Likely causes
- Customer ID mismatch: subscription exists in Stripe but points to different `customer_id` than stored in `profiles`.
- Subscription status drift because the relevant webhook hasn’t been delivered or is still retrying.

---

## Incident: “Duplicate upgrades / double side effects”

### What to check
- Ledger uniqueness:
  - Ensure `stripe_webhook_events.event_id` is unique and enforced (migration-level constraint).

### Expected behavior
- Replays/retries should **not** create double effects; duplicate event IDs short-circuit safely.

---

## Incident: “Webhook delivery retries forever”

### What to check
- Webhook route response behavior:
  - **400** means signature issues (Stripe will treat as failed but may not retry the same way as 5xx; fix signature configuration).
  - **500** means TOTL asked Stripe to retry (truthful ACK) because DB writes failed.

### Likely causes
- Database write failing (RLS, schema drift, transient DB issues).
- Missing/invalid environment variables causing runtime failures.

---

## Incident: “Signature verification fails but env vars look correct”

### What to check
- In Sentry for `POST /api/stripe/webhook`, inspect failure context fields logged by the route:
  - `signaturePresent`
  - `signatureTimestamp` (parsed from `stripe-signature` `t=...`)
  - `bodyLength`
  - `contentLengthHeader`
  - `contentType`
  - `userAgent`
  - `stripeRequestId`
- Confirm request origin:
  - Stripe deliveries should have Stripe-like `userAgent`/headers.
  - Non-Stripe probes/forwarders often fail signature verification by design.
- Confirm endpoint secret pairing:
  - Stripe Dashboard webhook endpoint for production URL must match production `STRIPE_WEBHOOK_SECRET` exactly.
  - Ensure test-mode secret is not used for live deliveries (or vice versa).

### Interpretation tips
- `signaturePresent = false` → request likely did not originate from Stripe webhook delivery.
- `signaturePresent = true` + Stripe-like caller + repeated failures → secret mismatch is still most likely.
- `bodyLength` significantly different from `contentLengthHeader` → investigate upstream body mutation/proxying.

---

## Quick notes (guardrails)
- Entitlement fields are **DB-locked**: user-level PostgREST updates to Stripe/subscription fields are blocked by trigger.
- The webhook handler must remain **truthful**: do not return 2xx if DB writes failed.
- Avoid “silent defaults” on plan resolution; preserve existing `subscription_plan` if plan cannot be resolved.

