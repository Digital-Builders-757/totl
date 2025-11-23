# 💳 Stripe Troubleshooting Guide

Practical fixes for Stripe-related issues that recently surfaced in the subscription implementation. Keep this document updated whenever we uncover a new pattern.

---

## 1. Missing Environment Variables

- **Symptom:** Webhook handler fails with `Invalid signature` even though the payload is correct.
- **Cause:** `STRIPE_WEBHOOK_SECRET` not defined, so the Stripe SDK can’t verify requests.
- **Fix:** In `lib/stripe.ts`, fail fast with:
  ```ts
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }
  ```
  Document new env vars in `STRIPE_ENV_VARIABLES.txt` whenever they are introduced.

## 2. Invalid API Version Format (`.clover` suffix)

- **Symptom:** Type errors or runtime failures complaining about unsupported API version strings.
- **Cause:** Stripe API versions must use `YYYY-MM-DD` format; suffixes like `.clover` are not allowed.
- **Fix:** Update `lib/stripe.ts` to the latest official release string, **without** any suffixes. Example:
  ```ts
  apiVersion: '2024-06-20'
  ```

## 3. `current_period_end` Removed from Subscription

- **Symptom:** TypeScript errors or undefined values when reading `subscription.current_period_end`.
- **Cause:** Stripe API 2025-03-31+ moved `current_period_end` to the subscription **item**.
- **Fix:** Read from subscription items, and only fall back to the legacy property if necessary:
  ```ts
  const itemWithPeriodEnd = subscription.items.data.find(
    (item) => typeof (item as any).current_period_end === 'number'
  );
  ```
  Convert the Unix timestamp to ISO before storing in Supabase.

## 4. Billing Portal Session URL Validation

- **Symptom:** Redirecting to `undefined` when Stripe fails to return a portal URL.
- **Fix:** After creating the session in `app/talent/settings/billing/actions.ts`, verify the URL:
  ```ts
  if (!session.url) {
    throw new Error('Failed to create billing portal session');
  }
  ```

## 5. Subscription Plan Detection

- **Symptom:** Profiles revert to the incorrect plan (defaulting to “monthly”).
- **Fix:** Inspect every subscription item and fall back to `subscription.metadata.plan`. If no plan can be determined, preserve the existing `profiles.subscription_plan` value instead of overwriting it with `null`. Log a warning so we know to investigate.

## 6. Webhook Acknowledges Failure

- **Symptom:** Stripe receives `{ received: true }` even when Supabase queries fail, so it stops retrying and data drifts.
- **Fix:** Have `handleSubscriptionUpdate()` return a boolean result (or throw) and respond with HTTP 500 when database lookups or updates fail. Stripe will then retry the webhook automatically.

---

### Maintenance Checklist

1. **Keep API version strings current** – update `lib/stripe.ts` as soon as Stripe publishes a new stable release.
2. **Document every new Stripe quirk here** – this guide should grow with each issue we encounter.
3. **Cross-reference `docs/COMMON_ERRORS_QUICK_REFERENCE.md`** – add a short entry there that links back to the detailed fix here.
4. **Verify tests** – always run `npm run build` after modifying Stripe integrations.

By maintaining this guide we avoid repeating the same debugging cycle and keep the subscription flow stable. Update it whenever we refine the implementation or discover a new gotcha.

