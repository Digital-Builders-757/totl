# Email Notifications Contract

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define how emails are generated and sent, what routes/actions are allowed to send them, and the canonical primitives (winner) to prevent drift.

> Layer 2 contract: does not restate Layer 1 laws.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/infrastructure-flow.md`

---

## Canonical primitives (winners)

### Send primitive
- `lib/email-service.ts`
  - `sendEmail({ to, subject, html, text? })`
  - `logEmailSent(to, template, success, error?)`

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

**UNVERIFIED:** authentication/authorization policy for these routes (some may be public); must be audited.

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

---

## Related docs (reference)
- `docs/EMAIL_NOTIFICATION_SYSTEM_IMPLEMENTATION.md` (should become a pointer to this contract once migrated)
