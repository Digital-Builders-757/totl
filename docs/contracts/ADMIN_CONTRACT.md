# Admin Contract (Users, Moderation, Career Builder approvals)

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define admin-only surfaces, canonical admin operations, and the promotion workflow for Career Builders.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/role-surfaces.md`
- Role + promotion boundary: `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` → “Role Promotion Boundary”

---

## Routes involved (exact paths)

### Admin terminal (protected)
- `/admin/dashboard`
- `/admin/users`
- `/admin/users/create`
- `/admin/gigs`
- `/admin/gigs/create`
- `/admin/applications`
- `/admin/applications/[id]`
- `/admin/client-applications`
- `/admin/moderation`

### API routes (admin)
- `/api/admin/create-user`
- `/api/admin/delete-user`
- `/api/admin/update-user-role`
- `/api/admin/check-auth-schema`
- `/api/admin/test-connection`

---

## Canonical services/actions

### Admin metrics: Paid Talent (Subscriptions) (official definition)

**Purpose:** Track subscription performance as **paid members**, not Stripe revenue truth.

**Definition (MVP; freeze):**
- **Paid Talent** = `public.profiles.role = 'talent'` AND `public.profiles.subscription_status = 'active'`
- **Bucket by plan**:
  - `subscription_plan = 'monthly'` → **monthly**
  - `subscription_plan = 'annual'` → **annual**
  - anything else / NULL → **unknown** (must be surfaced; do not hide drift)

**Dashboard display:**
- Show counts (monthly/annual/unknown).
- Show **Estimated** MRR/ARR derived from counts (no Stripe API calls):
  - MRR est. = `monthly * $20 + annual * ($200 / 12)` (display $16.67/mo per annual sub)
  - ARR est. = `monthly * $240 + annual * $200`

**Source of truth:** subscription fields are written by the Stripe webhook into `public.profiles`.

### Career Builder approval (promotion)
- `lib/actions/client-actions.ts`
  - `approveClientApplication(applicationId: string, adminNotes?: string)`
  - `rejectClientApplication(applicationId: string, adminNotes?: string)`
  - `submitClientApplication(data)` (submission side; used by `/client/apply`)

### Career Builder approval pipeline (end-to-end; admin-controlled promotion)

**Routes involved**
- Submission: `/client/apply`
- Admin review: `/admin/client-applications`

**Tables touched**
- `public.client_applications` (submission + admin decision)
- `public.profiles` (promotion writes)
- `public.client_profiles` (created on approval; idempotent)

**RLS truth**
- Do not restate policies here.\n  - Canonical RLS truth for `client_applications` (and the public profile visibility implications) lives in:\n    - `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` → “RLS truth (effective policies from migrations)”

**Failure modes**
- Applicant email mismatch: authenticated insert to `client_applications` fails if `email` does not match `auth.users.email`.\n  - Evidence: `supabase/migrations/20251209095547_fix_client_applications_rls_for_authenticated_users.sql`
- Accidental promotion bypass: any UI or server action directly setting `profiles.role/account_type`.\n  - Must obey Role Promotion Boundary.

**Proof**
- Use the “After client application approval (promoted state)” SQL block in:\n  - `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`\n

### Moderation
- `lib/actions/moderation-actions.ts`
  - `flagGigAction(...)`
  - `flagProfileAction(...)`
  - `updateContentFlagAction(...)`

### Admin user management API
- `app/api/admin/*/route.ts` (server-only)
  - These routes must verify:
    - session via `createSupabaseServer()` and `auth.getUser()`
    - admin role via `profiles.role = 'admin'`

---

## Data model touched

### Tables
- `public.profiles`
  - `role`, `account_type`, `is_suspended`, `suspension_reason`, `email_verified`, subscription fields
- `public.client_applications`
  - `status`, `admin_notes`, follow-up timestamps
- `public.client_profiles`
  - created during approval (idempotent)
- `public.content_flags`
  - moderation workflow (status, admin_notes, assigned_admin_id, resolved_at)
- `public.gigs` (admin can close gigs during moderation)

### Views (admin)
- `public.admin_talent_dashboard` (**UNVERIFIED until validated in migrations**)
- `public.admin_bookings_dashboard` (**UNVERIFIED until validated in migrations**)

---

## RLS expectations (intent)
**Verified source:** see `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` (RLS truth tables).\n\nHigh-level net effect relevant to Admin:\n- `client_applications`:\n  - Admins can view/manage all.\n  - Authenticated users can view/insert only “own” applications (email match).\n- `client_profiles`:\n  - Any authenticated user can select all rows (policy `Client profiles view`).\n  - This requires application-level column discipline on any “broad read” surfaces.

---

## Known failure modes

1) **Career Builder role granted without approval**
- Symptom: user becomes `role=client` unexpectedly.
- Likely cause: non-admin code path writing `profiles.role/account_type`.
- See `docs/OFF_SYNC_INVENTORY.md`.

2) **Admin tools break due to missing service role key**
- Symptom: create/delete users fails.
- Cause: missing `SUPABASE_SERVICE_ROLE_KEY`.

3) **Moderation update fails**
- Symptom: cannot update flags; error indicates permission.
- Cause: admin not recognized or RLS mismatch.

---

## Proof (acceptance + test steps)

### Acceptance checklist
- Non-admin cannot access `/admin/*`.
- Admin can:
  - approve client applications (promotion)
  - suspend/reinstate accounts
  - close gigs via moderation

### Manual test steps
- Login as admin → visit `/admin/dashboard`.
- Approve a `client_applications` row → verify:
  - `client_applications.status='approved'`
  - `profiles.role='client' AND profiles.account_type='client'`
  - `client_profiles` exists

### Automated tests
- `tests/admin/admin-functionality.spec.ts` (audited: contains a direct “Change user role → client” test, which is drift vs Role Promotion Boundary; tracked in `docs/DRIFT_REPORT.md`).

---

## Related docs (reference)
- `docs/ADMIN_ACCOUNT_GUIDE.md` (to be merged into this contract)
- `docs/CLIENT_ACCOUNT_FLOW_PRD.md` (product PRD; not authoritative contract)
