# PRD – Move Stripe From Test to Production & Launch Subscriptions

_Last updated: November 25, 2025_

---

## 1. Summary

We must migrate the TOTL Agency Stripe integration from **test mode** to **live mode** and enable **monthly and yearly subscriptions**. Goals:

- Use live Stripe keys and price IDs everywhere (Cursor, `.env.local`, Supabase functions, Vercel).
- Keep a fully working subscription flow (checkout → webhook → Supabase update → gated features) running in production.
- Preserve test/dev parity so developers can continue using test mode locally.

---

## 2. Objectives & Success Criteria

### Objectives

1. Replace all test-mode credentials with live-mode keys in production.
2. Support at least two subscription products:
   - `MONTHLY_PLAN`
   - `YEARLY_PLAN`
3. Ensure users can start subscriptions, webhooks update Supabase, and feature gating reacts instantly.
4. Keep dev/test environments intact.

### Success Criteria

- Live users can complete checkout, return via success/cancel URLs, and gain upgraded access once Stripe confirms the subscription.
- Admins can inspect active subscriptions in both Stripe Dashboard (live) and Supabase.
- No live secret keys leak to client bundles or logs.

---

## 3. Scope

### In Scope

- Configure live Stripe keys + price IDs.
- Update env vars (Cursor dev shells, `.env.local`, Vercel project, Supabase functions if used).
- Wire live Stripe Checkout for monthly and yearly plans.
- Ensure live webhooks update Supabase, including subscription + plan metadata.
- Display subscription status in talent/client/admin experiences (where relevant).

### Out of Scope (now)

- Complex tiering, coupons, invoicing UI, refunds automation.

---

## 4. Roles & User Stories

- **Talent**
- **Client**
- **Admin**

Example stories (focus on clients first):

1. As a Client, I can choose monthly or yearly plans and pay via Stripe to unlock premium features (posting more gigs, featured listings, etc.).
2. As a Client, I can view my current subscription status on my dashboard.
3. As a Talent, I should not see client-only upsells (or should see my own upgrade path when talent subscriptions launch).
4. As an Admin, I can review who is active, canceled, or past-due.

---

## 5. Functional Requirements

### 5.1 Subscription Plans

- Two plans live in Stripe: `Basic Monthly` and `Basic Yearly`.
- Env vars hold live price IDs:
  - `STRIPE_PRICE_MONTHLY`
  - `STRIPE_PRICE_YEARLY`

### 5.2 Checkout Flow

1. User clicks “Upgrade/Subscribe”.
2. Server action/API creates live `CheckoutSession` using stored `stripe_customer_id`.
3. Redirect user to Stripe Checkout (mode `subscription`).
4. On success, Stripe redirects back to success URL; UI reflects active state after webhook update.

### 5.3 Webhooks (Live Mode)

- Live endpoint `/api/webhooks/stripe`.
- Subscribe to: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Handler:
  - Verifies signature.
  - Maps to Supabase user.
  - Updates subscription fields (customer ID, subscription ID, status, plan, next billing dates).

### 5.4 Supabase Data Model

**Option A – `profiles` columns:**

- `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `subscription_plan`.

**Option B – `subscriptions` table (preferred for history):**

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Choose based on existing architecture + RLS constraints.

### 5.5 Feature Gating

- Server actions / RSC check Supabase for subscription status.
- Non-subscribers receive paywall messaging or limitations (e.g., gig posting caps).
- No critical gating solely client-side.

---

## 6. Technical Requirements

### 6.1 Env Vars

Need live values for:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`
- Optional: `STRIPE_CUSTOMER_PORTAL_URL`

Where:

1. **Local dev** – keep test keys in `.env.local`.
2. **Vercel prod** – add live values in Project Settings.
3. **Supabase Edge Functions** – use `supabase secrets set` if functions call Stripe.

### 6.2 Code Notes

- Secrets only on server (server actions, API routes, edge functions).
- Use `Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })`.
- Client code uses `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only for redirect utilities.
- Keep logic aligned with TOTL architecture (data access outside components).

---

## 7. Non-Functional Requirements

- **Security:** enforce webhook signature validation, never log secrets, ensure RLS prevents client writes to subscription fields.
- **Reliability:** webhook endpoint responds quickly and handles retries idempotently (store processed `stripe_event_id`).
- **Performance:** cache subscription status per request; avoid repeated DB hits in single render.

---

## 8. Migration Plan

### Step 1 – Stripe Dashboard

1. Switch to live mode.
2. Create/confirm live products & price IDs.
3. Configure live webhook endpoint with required events.
4. Capture live keys (`SECRET`, `PUBLISHABLE`, `WEBHOOK`, price IDs).

### Step 2 – Env Configuration

1. Update Vercel env vars with live keys.
2. Keep `.env.local` on test keys.
3. Ensure production build reads live vars (no leftover test keys).

### Step 3 – Code Audit

1. Replace any hard-coded test price IDs or keys with env references.
2. Confirm checkout actions use `mode: 'subscription'` and correct URLs.

### Step 4 – Webhook Implementation

1. Verify signature handling.
2. Map events to Supabase updates.
3. Log deliveries + responses for monitoring.

### Step 5 – Gating & UI

1. Add/verify server-side guards for subscriber-only features.
2. Provide upgrade buttons and “Manage billing” link (Stripe portal optional).

### Step 6 – Production Smoke Test

1. Use real card to purchase monthly plan.
2. Confirm redirect, UI change, Stripe + Supabase updates.
3. Cancel subscription to verify deletion event flow.

---

## 9. Risks & Mitigations

- **Mixing test/live keys** → audit env usage before deploy.
- **Webhook failures** → log events, rely on Stripe retries, add alerting.
- **RLS blocking updates** → webhook handler uses admin client / service role with explicit logic.

---

## 10. Next Session Checklist (starting point)

1. Inventory current Stripe env vars (test vs live).
2. Create live products + price IDs in Stripe dashboard.
3. Document env var diff (local vs Vercel) and prep updates.
4. Outline Supabase schema needs (columns vs dedicated table).
5. Plan webhook verification + logging strategy.

Use this file as the single reference when resuming work. Update `docs/DOCUMENTATION_INDEX.md` whenever this plan changes.


