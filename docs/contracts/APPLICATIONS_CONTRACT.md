# Applications Contract

**Date:** December 20, 2025  
**Status:** ✅ VERIFIED  
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
  - `acceptApplication({ applicationId, date?, compensation?, notes? })` (**atomic**; creates booking via DB RPC)

### API route (client)
- `app/api/client/applications/accept/route.ts`
  - Wrapper around canonical `acceptApplication()` (no independent “accept brain”).

---

## Data model touched
- `public.applications` (status, message, gig_id, talent_id)
- `public.gigs` (for ownership checks)
- `public.bookings` (created on acceptance)

### Atomicity + idempotency primitives (DB truth)
- Migration: `supabase/migrations/20251220095000_accept_application_atomic_rpc.sql`
  - **Unique guard**: `public.bookings` has **unique (gig_id, talent_id)** via `bookings_gig_talent_unique`
  - **RPC**: `public.accept_application_and_create_booking(application_id, booking_date?, booking_compensation?, booking_notes?)`

---

## State machine (VERIFIED)

### Application statuses (`public.application_status`)
- `new`
- `under_review`
- `shortlisted`
- `rejected`
- `accepted`

### Allowed transitions (product contract)
- **Client**
  - `new → under_review → shortlisted → accepted|rejected`
  - `new → accepted|rejected` (fast decision allowed)
- **Talent**
  - none (MVP; no withdraw)
- **Admin**
  - may override (admin tooling), but must not violate Role Promotion Boundary

---

## RLS proof table (DB truth)

Source-of-truth migrations:
- `supabase/migrations/20250101000001_rls_policies.sql`
- `supabase/migrations/20251016172507_fix_performance_advisor_warnings.sql` (optimized policy variants)
- `supabase/migrations/20250813190530_add_missing_tables_and_fields.sql` + subsequent RLS optimizations

### `public.applications`
- **Talent submits application**
  - **Query shape**: INSERT `applications(gig_id, talent_id, status, message)`
  - **Policy**: `Talents can insert own applications` / `Talent can apply to gigs`
  - **DB predicate**: `talent_id = (SELECT auth.uid())`
- **Talent reads own applications**
  - **Query shape**: SELECT filtered by `talent_id = auth.uid()`
  - **Policy**: `Applications access policy` / `Talents can view own applications`
- **Client lists applications for gigs they own**
  - **Query shape**: SELECT `applications` joined to `gigs` with `gigs.client_id = auth.uid()`
  - **Policy**: `Applications access policy` / `Clients can view gig applications`
  - **DB predicate**: `EXISTS (SELECT 1 FROM gigs WHERE gigs.id = applications.gig_id AND gigs.client_id = (SELECT auth.uid()))`
- **Client updates application status**
  - **Query shape**: UPDATE `applications.status` on the target `id`
  - **Policy**: `Update application status` / `Clients can update gig applications` (same ownership predicate as above)
- **Admin manages all**
  - **Policies**: `Admins can view all applications` + `Admins can manage all applications` (see `20251118001558_add_admin_application_policies.sql`)

### `public.bookings`
- **Important constraint**: bookings **do not** allow client INSERT under RLS (talent-only insert policy exists).
- Therefore, **client acceptance uses a server-only DB primitive** (`accept_application_and_create_booking`) that enforces gig ownership internally and does not broaden `bookings` INSERT permissions.

---

## Atomicity + idempotency clause (VERIFIED)

### Acceptance is atomic
- Accepting an application is executed as a single DB transaction via `public.accept_application_and_create_booking(...)`.
- The operation guarantees that booking creation and application status update do not drift (no “booking without accepted application” state emitted by the accept primitive).

### Acceptance is idempotent
- Repeating acceptance for the same application returns **success** and the **same booking id**.
- DB enforces “exactly one booking per (gig_id, talent_id)” via `bookings_gig_talent_unique`.

### Acceptance rules (transition guard; VERIFIED)
- Acceptance is permitted only when `applications.status ∈ { new, under_review, shortlisted }`.
- Acceptance is idempotent when `applications.status = accepted` (`accepted → accepted` is a no-op).
- Acceptance is forbidden when `applications.status = rejected` (terminal).
- These rules are enforced inside the DB primitive `public.accept_application_and_create_booking(...)` (see `20251220100500_harden_accept_application_rpc.sql`).

---

## Known failure modes

1) **406 errors / missing profile issues**
- Symptom: application submission errors, profile lookup failures.
- Likely cause: `.single()` usage where row may be missing.
  - **Fix (VERIFIED)**: contract-critical lookups that may be absent use `.maybeSingle()` (apply flow + client lists).

2) **Emails double-send / wrong URL**
- Cause: server actions calling `/api/email/*` via fetch.
- See `docs/OFF_SYNC_INVENTORY.md`.
  - **Fix (VERIFIED)**: acceptance/rejection emails are sent only on the first state transition (idempotent gating), using canonical `absoluteUrl()`.

3) **Career Builder promotion bypass (SECURITY BUG)**
- Symptom: `profiles.role/account_type` becomes `client` without a Career Builder approval.
- Rule: must obey `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` → “Role Promotion Boundary”.

---

## Proof (acceptance + test steps)
- Repo truth gate (local):  
  - `npm run schema:verify:comprehensive` → ✅ pass (Dec 20, 2025)  
  - `npm run types:check` → ✅ pass (Dec 20, 2025)  
  - `npm run build` → ✅ pass (Dec 20, 2025)  
  - `npm run lint` → ✅ pass (Dec 20, 2025)
- DB primitive proof (manual, once) — **PENDING**: run the 4-call RPC proofs (happy accept, idempotent accept, forbidden `42501`, terminal guard `P0001`) and paste the output snippets + timestamps here.
- Talent applies → application row exists.
- Client sees it in their dashboard list.
- Client accepts → booking row exists and talent sees confirmation.
- Client clicks Accept repeatedly → still 1 booking; no duplicate acceptance emails are emitted by retries (idempotent gating).
- Terminal guard proof: set application to `rejected`, attempt accept → deterministic failure (“Cannot accept a rejected application”), no booking created/modified, status remains `rejected`.

---

## Related docs (reference)
- `docs/APPLICATION_SUBMISSION_406_ERROR_REPORT.md`
