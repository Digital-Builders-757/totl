# TOTL — Error experience and logging hardening (work order)

**Date:** April 18, 2026 (updated April 23, 2026)  
**Status:** Waves 1–5 shipped — shared **`userSafeMessage`** / **`userSafeMessageFromActionError`**, hardened server actions, client toasts/forms, production API 5xx bodies, and **`console.*` → `logger`** in **`components/**`** and key **`app/**`** surfaces. Dev-only **`/api/dev/profile-bootstrap`** may still echo internal messages by design.

This document records current patterns, gaps, prioritized surfaces, and shared standards for user-facing errors vs internal logging.

---

## 1. Current error-handling patterns

| Pattern | Where | Notes |
|--------|--------|--------|
| **`logger` (`@/lib/utils/logger`)** | Server actions, many API routes, some client boundaries | Structured `context`, Sentry `captureException` / `captureMessage`, dev console, redaction |
| **`console.error` / `console.warn`** | Tests, `logger` internals, rare third-party shims | Prefer **`logger`** in app/components/API for Sentry correlation; remaining **`console.*`** in product code should be treated as debt |
| **`handleApiError` (`@/lib/api/api-utils`)** | Defined but **unused** in routes at audit time | Previously returned `error.message` in JSON 500 bodies (leak risk) — hardened to generic client message + `debugId` in logs |
| **Toasts with `error.message` / `result.error`** | Admin users, saved searches, login edge cases | Exposes Supabase/transport wording to users |
| **Sentry `beforeSend`** | `instrumentation-client.ts` | Heavy filtering (noise vs signal); separate from per-flow logging |
| **Route `error.tsx`** | Talent dashboard only (custom); rest fall through to **global** | Global used generic `NextError` — replaced with calm branded fallback |
| **`errorLogger` / `logError` (`@/lib/utils/error-logger`)** | Client dashboard fallbacks, `SafeImage` | In-memory + dev-only `logger.error` for `logError`; optional prod escalation documented below |
| **Duplicate module** | `lib/error-logger.ts` vs `lib/utils/error-logger.ts` | **Canonical:** `@/lib/utils/error-logger`; root file is thin re-export |

---

## 2. Biggest UX offenders (pre-hardening)

1. **`app/global-error.tsx`** — Default Next error page (`statusCode={0}`), not on-brand.
2. **Missing segment `error.tsx`** — Client dashboard, admin, bookings had no dedicated recovery UI.
3. **Admin / bookings / saved searches** — Raw error strings in toasts or inline UI.
4. **API helper** — `handleApiError` exposed internal messages (latent risk for future routes).

---

## 3. Biggest logging gaps (pre-hardening)

1. **`logError` in `error-logger`** — Only called `logger.error` in **development**; production had no Sentry path for those analytics-style errors.
2. **Inconsistent context keys** — Mixed ad-hoc strings; standardize on `flow`, `step`, entity ids.
3. **`console.*` in app flows** — No Sentry correlation, harder to grep.

---

## 4. Top routes/flows to harden (priority)

| Priority | Flow | Rationale |
|----------|------|-----------|
| P0 | Global + segment error boundaries | Prevents generic “something broke” without recovery |
| P0 | Admin user actions (delete/suspend/role) | High trust; raw errors feel broken |
| P0 | Client bookings load failures | Client-facing money/scheduling |
| P1 | Saved searches (gigs) | Frequent mutation; toast copy |
| P1 | Stripe subscribe + billing portal | Payment anxiety; must not show Stripe/transport dumps |
| P1 | Onboarding account type action | First-run trust |
| P1 | Notifications + dashboard server actions | Returning `{ error: message }` to clients |
| P2 | Auth / red zone | Surgical `logger` only; no behavior changes |

---

## 5. Recurring anti-patterns

- Using **`error.message`** (or `String(error)`) as user-visible copy.
- Treating **validation** and **unexpected** failures the same in UI.
- **Logging** without `flow` / correlation-friendly fields.
- **500 JSON** responses that echo stack or DB errors to browsers.

---

## 6. Proposed shared standards (implemented baseline)

### Internal logging

- Use **`logger.error("…", err, { flow, … })`** (or `logActionFailure` wrapper).
- Include **`flow`** (e.g. `admin.users.delete`, `bookings.load`, `billing.portal`).
- For rare deep dives, attach **`debugId`** (UUID) to logs only; optional **`debugId`** in safe API JSON for support (not stack traces).

### User-facing copy

- **Tier A — Inline / field:** Specific, actionable (validation).
- **Tier B — Toast:** Short headline + one sentence; no vendor internals.
- **Tier C — Full page / boundary:** Calm explanation + Try again; optional “Reference: {digest}” when Next provides digest.
- **`userSafeMessage` final pass-through:** After known vendor maps, `messageLooksInternalOrSqlLike` blocks stack traces, over-long text, and SQL/Postgres-shaped fragments (including `UPDATE`/`DELETE`-style short errors) so they fall back to generic copy instead of leaking to the UI.

### Server action / mutation returns

- Prefer **`{ ok: true, … } | { ok: false, code?: string, userMessage: string }`** for new work; legacy `{ error: string }` may still exist — map **userMessage** through **`userSafeMessage`** at the UI boundary when the string might be internal.

### Expected vs unexpected

- **Expected:** wrong password, duplicate email, validation — user copy + minimal Sentry (often filtered already).
- **Unexpected:** DB outage, RLS surprises, Stripe API failures — safe user copy + **full** structured log + Sentry.

---

## 7. Follow-up backlog (not exhaustive)

**Completed in repo pass (Apr 2026):** Extended **`userSafeMessage`** (JWT/rate-limit/auth-api heuristics) + **`userSafeMessageFromActionError`** for legacy **`{ error: string }`**; **`logActionFailure` / `userSafeMessage`** on settings, profile, client, dashboard actions; client forms/login/onboarding/admin surfaces map through safe helpers; admin API routes use generic 5xx JSON + structured logs; **`SafeImage`**, auth timeout recovery, Supabase connection test, email-ledger-debug, and booking-reminders cron use **`logger`** instead of raw **`console.*`**.

- Extend `userSafeMessage` with more Stripe/PostgREST codes as they appear in Sentry.
- Add `error.tsx` under more admin children if specific routes throw often.
- Sweep **`lib/**`** scripts and any remaining non-test **`console.*`** outside the paths above if grep finds new stragglers after future features.

---

## 8. References

- [`lib/utils/logger.ts`](../lib/utils/logger.ts)
- [`lib/errors/user-safe-message.ts`](../lib/errors/user-safe-message.ts) (introduced Apr 2026)
- [`docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`](troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md)
