# Stripe + Webhooks Contract

**Date:** December 20, 2025  
**Status:** ✅ VERIFIED  
**Purpose:** Define subscription creation, billing portal, and webhook handling with **provable** security (signature verification), **provable idempotency** (ledger), and **tamper-proof entitlements** (DB locks).

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md` (idempotency requirement)
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/infrastructure-flow.md`

---

## Routes involved (exact paths)
- `/talent/subscribe`
- `/talent/subscribe/success`
- `/talent/subscribe/cancelled`
- `/talent/settings/billing`

Webhook
- `/api/stripe/webhook`

---

## Canonical server actions/services
- `app/talent/subscribe/actions.ts`
  - `createTalentCheckoutSession(plan)`
- `app/talent/settings/billing/actions.ts`
  - `createBillingPortalSession()`
- `app/api/stripe/webhook/route.ts`
  - verifies Stripe signature (**fail closed**)
  - writes webhook event ledger (`stripe_webhook_events`) for idempotency + proofs
  - updates `profiles` subscription fields using admin client (service role)

---

## Data model touched
- `public.profiles`
  - `subscription_status`
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `subscription_plan`
  - `subscription_current_period_end`
- `public.stripe_webhook_events`
  - webhook processing ledger (**unique** `event_id`)

---

## Threat model + posture
- Webhook endpoint is **public by necessity**, but **authenticated** by Stripe signature.
- Requests with missing/invalid `stripe-signature` **must** return **400**.
- No internal “secret headers” or bypass flags are permitted for this route.
- Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are **server-only**.

---

## Canonical event handling rules (non-negotiable)
1) **Signature verification required (fail closed)**  
   - Missing/invalid signature → **400**

2) **Idempotency required (by Stripe `event.id`)**  
   - Every Stripe `event.id` is processed **at most once**.
   - Proof artifact: `public.stripe_webhook_events.event_id` has a **unique constraint**.

3) **Truthful ACK**  
   - If downstream DB writes fail, respond with **500** so Stripe retries.

4) **Out-of-order tolerance**  
   - Stripe delivery order is not guaranteed.
   - We prevent state regression by only applying updates if the incoming `event.created` is not older than the latest **processed** event for the same customer (using the ledger).
   - Duplicate deliveries while a previous attempt is still **processing** are treated as **in-flight duplicates** and short-circuit to avoid double side effects.

5) **Minimum data principle**  
   - Use explicit selects (no `select('*')`).

---

## Event matrix (handled vs ignored-but-recorded)

| Stripe event type | Handler behavior | DB writes |
|---|---|---|
| `checkout.session.completed` | If `mode=subscription`, retrieve subscription and sync state | ledger + `profiles` |
| `customer.subscription.created` | Sync subscription state | ledger + `profiles` |
| `customer.subscription.updated` | Sync subscription state | ledger + `profiles` |
| `customer.subscription.deleted` | Mark user as canceled and clear subscription fields | ledger + `profiles` |
| `invoice.payment_failed` | Recorded only (subscription state sync occurs via `customer.subscription.updated`) | ledger only |
| `invoice.payment_succeeded` | **Ignored but recorded** (not required for entitlement state; relies on subscription events) | ledger only |
| Any other event | **Ignored but recorded** (no side effects) | ledger only |

---

## State transitions (profiles entitlement surface)

`public.profiles.subscription_status` (enum):
- `'active'` → user is entitled to subscriber-only features
- `'past_due'` → payment issues; user is not entitled (or limited entitlement depending on feature gate)
- `'canceled'` → not entitled
- `'none'` → never subscribed; not entitled

`public.profiles.subscription_plan`:
- `'monthly'` or `'annual'` (normalized; never persist Stripe price IDs)

`public.profiles.subscription_current_period_end`:
- ISO timestamp; represents the end of the current billing period (if available)

`public.profiles.stripe_customer_id` / `stripe_subscription_id`:
- Stable Stripe identifiers used to map webhook events to a profile

---

## Idempotency & proof ledger (VERIFIED artifact)

Table: `public.stripe_webhook_events`
- **Unique**: `event_id` (Stripe `event.id`)
- Columns capture: `type`, `stripe_created`, `received_at`, `processed_at`, `status`, `error`, and optional Stripe IDs

Ledger statuses:
- `processing` → inserted, handler running
- `processed` → side effects applied successfully
- `failed` → handler failed; Stripe should retry (HTTP 500)
- `ignored` → intentionally ignored (unhandled event type or out-of-order)

---

## DB Locks (tamper-proof entitlement fields)

Problem: If `profiles` has a broad “update your profile” policy, a user could mutate subscription fields via PostgREST.

Solution: A DB trigger blocks user-level updates to:
- `stripe_customer_id`, `stripe_subscription_id`
- `subscription_status`, `subscription_plan`, `subscription_current_period_end`

Only the server-side service role (webhook/admin server actions) is permitted to mutate these fields.

**Migration:** `supabase/migrations/20251220033929_add_stripe_webhook_events_ledger.sql`

---

## Known failure modes
- Missing env vars → Stripe client throws at import time (`lib/stripe.ts`).
- Webhook signature invalid → request rejected (400).
- DB writes fail → webhook responds **500** so Stripe retries.

---

## Proof (acceptance + reviewer test plan)

### Automated proofs (minimum)
- Invalid signature → **400**
- Same `event.id` twice → second is no-op (2xx) and **no double effects**
- Downstream DB failure → **500** (truthful ACK)
- Out-of-order delivery → older event does **not** overwrite newer processed state

### Reviewer test plan (manual)
- Start checkout → profile gets `stripe_customer_id`
- Stripe delivers subscription event(s) → profile reflects correct `subscription_status/plan/period_end`
- Replay webhook event → no duplicate entitlement changes
- Force a failure path (simulate DB error) → webhook returns **500** and Stripe retries

---

## Runbook
- `docs/STRIPE_WEBHOOKS_RUNBOOK.md`

---

## Related docs (reference)
- `docs/STRIPE_IMPLEMENTATION_PLAN.md`
- `docs/STRIPE_SUBSCRIPTION_PRD.md`
- `docs/STRIPE_TROUBLESHOOTING.md`
