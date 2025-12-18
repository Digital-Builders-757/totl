# Stripe + Webhooks Contract

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define subscription creation, billing portal, and webhook handling (must be idempotent).

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
  - verifies Stripe signature
  - updates `profiles` subscription fields using admin client

---

## Data model touched
- `public.profiles`
  - `subscription_status`
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `subscription_plan`
  - `subscription_current_period_end`

---

## Idempotency expectations
- Webhook must be safe on retries.
- Updates must be keyed by stable identifiers (Stripe customer/subscription ids).

**Evidence:** `app/api/stripe/webhook/route.ts` updates profile by `stripe_customer_id`.

---

## Known failure modes
- Missing env vars → Stripe client throws at import time (`lib/stripe.ts`).
- Webhook signature invalid → request rejected.

---

## Proof (acceptance + test steps)
- Talent starts checkout → profile has stripe_customer_id.
- Stripe webhook updates subscription_status and current period end.

---

## Related docs (reference)
- `docs/STRIPE_IMPLEMENTATION_PLAN.md`
- `docs/STRIPE_SUBSCRIPTION_PRD.md`
- `docs/STRIPE_TROUBLESHOOTING.md`
