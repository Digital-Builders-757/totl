# Email Notifications Contract

**Date:** December 18, 2025  
**Status:** ✅ VERIFIED  
**Last audited:** December 20, 2025  
**Purpose:** Define how emails are generated and sent, what routes/actions are allowed to send them, and the canonical primitives (winner) to prevent drift.

> Layer 2 contract: does not restate Layer 1 laws.

---

## Scope (what “email” means in TOTL)

- **Transactional only** (verification, password reset, application/booking notifications, admin alerts)
- **No marketing** in MVP (separate contract if ever added)
- **Server-only sending**: no client component should call providers directly

---

## Auth posture for `/api/email/*` (explicit)

Middleware bypasses `/api/*` (see `middleware.ts`), so every email route MUST enforce its own posture.

### Public-callable (pre-auth)

These may be called without a session, but MUST NOT leak whether an account exists.

- `/api/email/send-verification`
- `/api/email/send-password-reset`

**Existence leak policy (MANDATORY)**:
- Always return `{ success: true, requestId }` for “unknown email / user not found / link generation failed”.

### Internal-only (server triggers)

These must never be callable directly from the browser.

Enforcement: require header `x-totl-internal-email-key` matching `INTERNAL_EMAIL_API_KEY` (dev default: `dev-internal-email-key`).
The dev default is only allowed on **local** dev; hosted previews must set `INTERNAL_EMAIL_API_KEY`.

- `/api/email/send-welcome`
- `/api/email/send-application-received`
- `/api/email/send-new-application-client`
- `/api/email/send-application-accepted`
- `/api/email/send-application-rejected`
- `/api/email/send-booking-confirmed`

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/infrastructure-flow.md`

---

## Canonical primitives (winners)

### Canonical URL builder (winner)
- `lib/server/get-site-url.ts`
  - `getSiteUrl()` / `absoluteUrl("/path")`
  - Rule: do not inline `${process.env.NEXT_PUBLIC_SITE_URL}/...` in call sites.

### Send primitive
- `lib/email-service.ts`
  - `sendEmail({ to, subject, html, text? })`
  - `logEmailSent(to, template, success, error?)`

**P0 rule (production safety):**
- In **production**, missing provider credentials must **fail loudly** (no “fake success”).
  - For automated tests, we disable provider calls via `DISABLE_EMAIL_SENDING=1` (see `playwright.config.ts`).

### Template primitive
- `lib/services/email-templates.tsx`
  - Generator functions (examples):
    - `generateVerificationEmail`
    - `generatePasswordResetEmail`
    - `generateApplicationReceivedEmail`
    - `generateNewApplicationClientEmail`
    - Career Builder templates (`generateClientApplication*`)

### Allowed call sites
- Server Actions (`"use server"`) and Route Handlers (`app/api/**/route.ts`).

### Forbidden call sites (winner declared)
- Server Actions must not call internal `/api/email/*` via `fetch()`.
  - This is a declared **off-sync** pattern. See `docs/OFF_SYNC_INVENTORY.md`.
  - Rule: no internal HTTP hops (server → same server). Use direct function calls instead.

### Abuse control (public routes)
- Public routes MUST have a minimum abuse throttle (best-effort is OK in MVP):
  - Winner: `lib/server/email/public-email-throttle.ts`
  - Rule: throttle MUST NOT change response semantics (still return `{ success: true, requestId }`).
  - Note: throttle is **best-effort unless backed by shared storage** (Redis/DB/etc); in serverless/multi-instance it may not be strict.

---

## API routes (existing entrypoints)

> These exist today; contract prefers **direct calls** in server actions, but routes remain supported.

- `app/api/email/send-verification/route.ts`
- `app/api/email/send-password-reset/route.ts`
- `app/api/email/send-welcome/route.ts`
- `app/api/email/send-application-received/route.ts`
- `app/api/email/send-new-application-client/route.ts`
- `app/api/email/send-application-accepted/route.ts`
- `app/api/email/send-application-rejected/route.ts`
- `app/api/email/send-booking-confirmed/route.ts`

**Auth posture:** see section above (“Auth posture for `/api/email/*`”).

---

## Email Ledger (VERIFIED map)

**Rule:** Every `EmailTemplate` value must appear **exactly once** in this ledger.  
If an email type is not used in MVP, it must be explicitly marked **NOT IMPLEMENTED (MVP)**.

| Email type (`EmailTemplate`) | Canonical trigger (single source) | Entry surface | Posture | Template generator | Link builder | Proof |
| --- | --- | --- | --- | --- | --- | --- |
| `verification` | `app/api/email/send-verification/route.ts` `POST()` (triggered by `components/auth/auth-provider.tsx` `sendVerificationEmail()`) | API route | Public-callable + non-leaky | `generateVerificationEmail({ name, verificationUrl })` | `absoluteUrl("/auth/callback")` (for Supabase `redirectTo`) | `tests/api/email-routes.spec.ts` (public shape + internal-only 403 checks) |
| `password-reset` | `app/api/email/send-password-reset/route.ts` `POST()` (triggered by `components/auth/auth-provider.tsx` `resetPassword()`) | API route | Public-callable + non-leaky | `generatePasswordResetEmail({ name, resetUrl })` | `absoluteUrl("/update-password")` (for Supabase `redirectTo`) | `tests/api/email-routes.spec.ts` (uniform success on unknown email) |
| `welcome` | NOT IMPLEMENTED (MVP) | — | Internal-only route exists (`/api/email/send-welcome`) | `generateWelcomeEmail({ name, loginUrl })` | `absoluteUrl("/login")` | `tests/api/email-routes.spec.ts` (403 without header) |
| `application-received` | `app/gigs/[id]/apply/actions.ts` `applyToGig()` | Server action | Server-only | `generateApplicationReceivedEmail({ name, gigTitle })` | N/A | `tests/api/email-routes.spec.ts` (route guard exists) |
| `new-application-client` | `app/gigs/[id]/apply/actions.ts` `applyToGig()` | Server action | Server-only | `generateNewApplicationClientEmail({ name, gigTitle, dashboardUrl })` | `absoluteUrl("/client/dashboard")` | `tests/api/email-routes.spec.ts` (route guard exists) |
| `application-accepted` | `lib/actions/booking-actions.ts` `acceptApplication()` (fires only when DB RPC reports a first-time acceptance) | Server action | Signed-in (client) | `generateApplicationAcceptedEmail({ name, gigTitle, clientName, dashboardUrl })` | `absoluteUrl("/talent/dashboard")` | manual: accept same application twice → only first run sends |
| `booking-confirmed` | `lib/actions/booking-actions.ts` `acceptApplication()` (fires only when DB RPC reports a first-time acceptance) | Server action | Signed-in (client) | `generateBookingConfirmedEmail({ ... })` | `absoluteUrl("/talent/dashboard")` | manual: accept same application twice → only first run sends |
| `application-rejected` | `lib/actions/booking-actions.ts` `rejectApplication()` | Server action | Signed-in (client) | `generateApplicationRejectedEmail({ name, gigTitle })` | N/A | `tests/api/email-routes.spec.ts` (internal route guard exists) |
| `booking-reminder` | NOT IMPLEMENTED (MVP) | — | — | — | — | N/A |
| `gig-invitation` | NOT IMPLEMENTED (MVP) | — | — | — | — | N/A |
| `client-application-confirmation` | `lib/actions/client-actions.ts` `submitClientApplication()` | Server action | Signed-in | `generateClientApplicationConfirmationEmail(...)` | N/A | `tests/api/email-routes.spec.ts` (email system primitives present); manual: submit client application |
| `client-application-admin` | `lib/actions/client-actions.ts` `submitClientApplication()` | Server action | Signed-in | `generateClientApplicationAdminNotificationEmail(...)` | N/A | manual: submit client application |
| `client-application-approved` | `lib/actions/client-actions.ts` `approveClientApplication()` | Server action | Admin-only (app-level) | `generateClientApplicationApprovedEmail(...)` | `absoluteUrl("/login")` | manual: approve client application |
| `client-application-rejected` | `lib/actions/client-actions.ts` `rejectClientApplication()` | Server action | Admin-only (app-level) | `generateClientApplicationRejectedEmail(...)` | N/A | manual: reject client application |
| `client-application-followup-admin` | `lib/actions/client-actions.ts` `sendClientApplicationFollowUpReminders()` | Server action | Server-only (admin job) | `generateClientApplicationFollowUpAdminEmail(...)` | N/A | manual: run follow-up reminders |
| `client-application-followup-applicant` | `lib/actions/client-actions.ts` `sendClientApplicationFollowUpReminders()` | Server action | Server-only (admin job) | `generateClientApplicationFollowUpApplicantEmail(...)` | N/A | manual: run follow-up reminders |

**Ledger rule (no duplicates):** a second trigger for any `EmailTemplate` is a contract violation.

---

## Email types (templates)

Source: `lib/email-service.ts` (union type `EmailTemplate`).

- `welcome`, `verification`, `password-reset`
- `application-received`, `application-accepted`, `application-rejected`
- `booking-confirmed`, `booking-reminder`
- `new-application-client`
- Career Builder:
  - `client-application-admin`
  - `client-application-confirmation`
  - `client-application-approved`
  - `client-application-rejected`
  - `client-application-followup-applicant`
  - `client-application-followup-admin`

---

## Data model touched

- No email tables are currently canonical.
- `logEmailSent()` currently logs to console.

**UNVERIFIED:** whether an `email_logs` table exists (commented example exists in `lib/email-service.ts`).

---

## Failure modes

1) **Emails silently not sent in local/dev**
- Cause: `RESEND_API_KEY` not set.
- Behavior: `sendEmail()` returns success in dev to avoid build failures.

2) **Emails sent twice**
- Cause: server action sends email AND also calls API route that sends email.

3) **Wrong URLs in emails**
- Cause: using `NEXT_PUBLIC_SITE_URL` inconsistently across call sites.

---

## Proof (acceptance + test steps)

### Acceptance checklist
- For each user-facing event, exactly one email is sent.
- Templates are generated from `lib/services/email-templates.tsx`.
- Send primitive is `lib/email-service.ts`.

### Test steps
- Run unit tests for templates:
  - `lib/services/email-templates.test.ts`
- Run Playwright flows that trigger emails (best-effort; depends on env):
  - `tests/integration/application-email-workflow.spec.ts` (**UNVERIFIED until audited**)
- Run API posture/shape checks:
  - `tests/api/email-routes.spec.ts` (must include public “no user existence leak” checks for password reset / verification)

---

## Related docs (reference)
- `docs/EMAIL_NOTIFICATION_SYSTEM_IMPLEMENTATION.md` (should become a pointer to this contract once migrated)
