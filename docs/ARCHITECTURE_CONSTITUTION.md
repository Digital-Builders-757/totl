# Architecture Constitution (MANDATORY)

**Date:** December 16, 2025  
**Status:** ✅ COMPLETE  
**Purpose:** Define the non-negotiable architectural boundaries for TOTL so changes remain safe, predictable, and reversible.

---

## Non‑Negotiables (Do Not Violate)

- **Middleware = security only**: allow/deny/redirect only. No business logic. No DB writes.
- **Auth identity ≠ app identity**: `auth.users` is identity; `public.profiles` is the application source of truth.
- **Missing profile is a valid bootstrap state**: middleware must allow safe routes; changes must prevent redirect loops.
- **All mutations are server-side**: Server Actions or API Routes only.
- **No DB calls in client components**: no writes and no privileged reads.
- **RLS is final authority**: never bypass RLS with service role in client/browser code.
- **No `select('*')`**: always select explicit columns.
- **Never edit generated types**: `types/database.ts` (and re-exports) are auto-generated only.
- **Stripe webhooks must be idempotent**: verify signatures; safe to retry; update-by-key; no double effects.

---

## Core Boundary Map (Who Does What)

- **Supabase Auth**: identity + sessions (`auth.users`). It does *not* decide roles or permissions.
- **Database (`public.*`)**: app source of truth + RLS + triggers. Responsible for automatic profile creation.
- **Middleware (`middleware.ts`)**: request gatekeeping only (session/role/suspension/route access).
- **Server Actions / API Routes**: the only place to mutate data, call Stripe, and send emails.
- **UI (Client Components)**: presentation and user intent only. No “business truth”.

---

## Red Flag Files (Treat as Dangerous Zones)

If you modify any of these, you must follow the protocol below.

### Security / Routing Spine
- `middleware.ts` (**security only**)
- `lib/constants/routes.ts`
- `lib/routing/decide-redirect.ts`
- `lib/utils/determine-destination.ts`
- `lib/utils/route-access.ts`
- `lib/utils/return-url.ts`

### Auth + Profile Bootstrap
- `components/auth/auth-provider.tsx` (auth state owner)
- `components/auth/require-auth.tsx`
- `components/auth/sign-in-gate.tsx`
- `lib/actions/auth-actions.ts` (ensure profile exists + login redirect)
- `app/auth/callback/page.tsx` (fragile)
- `app/(auth)/**`
- `app/api/auth/*`

### Stripe / Billing
- `app/api/stripe/webhook/route.ts` (**must be idempotent**)
- `app/talent/subscribe/actions.ts`
- `app/talent/settings/billing/actions.ts`
- `lib/stripe.ts`, `lib/subscription.ts` (if present)

### Schema Truth
- `supabase/migrations/**` (never edit existing migrations)
- `types/database.ts` (generated)
- `database_schema_audit.md` (schema truth)

---

## Red Flag Editing Protocol (MANDATORY)

If your change touches **auth, middleware, redirects, profiles, onboarding, Stripe webhooks, or RLS**:

1) **Summarize this constitution in 5 bullets** (in your PR/agent output).
2) **Propose the change** as a minimal diff (what you will change + why).
3) **List risk points + tests** (redirect loops, bootstrap edge cases, RLS behavior, webhook retries).
4) **Prove loop safety** if touching middleware/auth callback/profile bootstrap:
   - explain how the change prevents infinite redirects
   - call out any “safe routes” exceptions and why they are safe
5) **Prove idempotency** if touching Stripe webhook logic:
   - updates keyed by Stripe customer/subscription ids
   - safe when Stripe retries the same event

---

## Practical Checks Before Writing Code

- **Check schema first**: read relevant `supabase/migrations/**` + generated types.
- **Explicit selects**: pick columns intentionally; do not rely on `*`.
- **RLS-first mindset**: design queries/mutations that succeed under least privilege.
- **Prefer small diffs**: especially in red flag files.
