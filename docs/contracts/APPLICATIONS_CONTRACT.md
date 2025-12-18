# Applications Contract

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define application submission, client review, admin oversight, and the email/booking side effects.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/core-transaction-sequence.md`
- `docs/diagrams/infrastructure-flow.md`
- Role + promotion boundary: `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` → “Role Promotion Boundary”

---

## Routes involved (exact paths)
- `/gigs/[id]/apply` (talent submits application)
- `/client/applications` (client reviews incoming applications)
- `/admin/applications` (admin oversight)
- `/admin/applications/[id]` (admin detail)

---

## Canonical server actions/services

### Submit
- `app/gigs/[id]/apply/actions.ts`
  - `applyToGig({ gigId, message? })`

### Review workflow (client)
- `lib/actions/booking-actions.ts`
  - `updateApplicationStatus({ applicationId, status })`
  - `rejectApplication({ applicationId, reason? })`
  - `acceptApplication({ applicationId, date?, compensation?, notes? })` (creates booking)

### API route (client)
- `app/api/client/applications/accept/route.ts` (**UNVERIFIED contents; must be audited**) 

---

## Data model touched
- `public.applications` (status, message, gig_id, talent_id)
- `public.gigs` (for ownership checks)
- `public.bookings` (created on acceptance)

---

## RLS expectations (intent)
- Talent can create their own application rows.
- Client can read applications for gigs they own.
- Admin can read/manage all.

**UNVERIFIED:** policy names and exact constraints.

---

## Known failure modes

1) **406 errors / missing profile issues**
- Symptom: application submission errors, profile lookup failures.
- Likely cause: `.single()` usage where row may be missing.

2) **Emails double-send / wrong URL**
- Cause: server actions calling `/api/email/*` via fetch.
- See `docs/OFF_SYNC_INVENTORY.md`.

3) **Career Builder promotion bypass (SECURITY BUG)**
- Symptom: `profiles.role/account_type` becomes `client` without a Career Builder approval.
- Rule: must obey `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` → “Role Promotion Boundary”.

---

## Proof (acceptance + test steps)
- Talent applies → application row exists.
- Client sees it in their dashboard list.
- Client accepts → booking row exists and talent sees confirmation.

---

## Related docs (reference)
- `docs/APPLICATION_SUBMISSION_406_ERROR_REPORT.md`
