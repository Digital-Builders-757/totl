# Admin Contract (Users, Moderation, Career Builder approvals)

**Date:** December 20, 2025  
**Status:** ✅ VERIFIED  
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
- `/api/admin/disable-user` (legacy; defaults to suspend when `suspended` omitted)
- `/api/admin/set-user-suspension` (canonical suspend / reinstate)
- `/api/admin/invite-career-builder`
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

**Dashboard display (Overview card):**
- Show **Estimated** MRR/ARR derived from counts (no Stripe API calls):
  - MRR est. = `monthly * $20 + annual * ($200 / 12)` (display $16.67/mo per annual sub)
  - ARR est. = `monthly * $240 + annual * $200`
- Full breakdown (monthly/annual/unknown counts) may be surfaced on admin talent page or settings; Overview card keeps focus on earnings.

**Source of truth:** subscription fields are written by the Stripe webhook into `public.profiles`.

### Career Builder approval (promotion)
- `lib/actions/client-actions.ts`
  - `approveClientApplication(applicationId: string, adminNotes?: string)`
  - `rejectClientApplication(applicationId: string, adminNotes?: string)`
  - `submitClientApplication(data)` (submission side; used by `/client/apply`)

### DB primitives (VERIFIED; single source of truth for promotion/decision)
- Migration: `supabase/migrations/20251220130000_client_application_promotion_rpc.sql`
  - `public.approve_client_application_and_promote(p_application_id uuid, p_admin_notes text)`
    - Atomic: updates `client_applications` + promotes `profiles` + provisions `client_profiles`
    - Idempotent: `approved → approved` is a no-op (`did_promote=false`)
    - Terminal guard: `rejected → approved` is forbidden (deterministic `P0001`)
  - `public.reject_client_application(p_application_id uuid, p_admin_notes text)`
    - Atomic: updates `client_applications` decision
    - Idempotent: `rejected → rejected` is a no-op (`did_decide=false`)
    - Terminal guard: `approved → rejected` is forbidden (deterministic `P0001`)

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
- Auth posture mismatch: allowing signed-out access to `/client/apply` or `/client/application-status` while `client_applications` is auth-owned.\n  - LAW: Career Builder application is **AUTH REQUIRED** and ownership is enforced via `client_applications.user_id = auth.uid()` (no `auth.users` references).
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
  - Admin user lifecycle guardrails:
    - **Suspend / reinstate:** targets must be `profiles.role` in `('talent','client')`; writes `profiles.is_suspended` and optional `suspension_reason` on suspend; reinstate clears `suspension_reason`. Use **`POST /api/admin/set-user-suspension`** with `{ userId, suspended: boolean, reason? }`. **`POST /api/admin/disable-user`** remains a backward-compatible alias (omit `suspended` → suspend). **Admin** profile targets are rejected (400). **Self** actions rejected (400).
    - **Hard delete (admin workflow):** target must be `profiles.role = 'talent'`; uses `POST /api/admin/delete-user` (auth user delete + DB cascades). If production still hits GoTrue **“Database error deleting user”**, verify FKs (especially `content_flags.assigned_admin_id` → **`ON DELETE SET NULL`**) via migration `20260414120000_repair_fks_for_auth_user_delete.sql` and `supabase/diagnostics/auth-user-delete-fk-audit.sql`.
    - admin cannot suspend, reinstate, or hard-delete self
    - admin cannot hard-delete another admin
    - hard delete for Career Builder accounts is blocked (409); **suspend** is the official reversible policy because dependent rows can violate FK constraints on auth user delete

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
**Verified source:** see `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` (RLS truth tables).\n\nHigh-level net effect relevant to Admin:\n- `client_applications`:\n  - Admins can view/manage all.\n  - Authenticated users can view/insert only “own” applications (ownership by `user_id = auth.uid()`).\n- `client_profiles`:\n  - Any authenticated user can select all rows (policy `Client profiles view`).\n  - This requires application-level column discipline on any “broad read” surfaces.

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

4) **Talent hard delete fails with generic database error**
- Symptom: `POST /api/admin/delete-user` returns 500/409 or Sentry shows `AuthApiError: Database error deleting user`.
- Likely cause: FK still **`NO ACTION`** on a child of `profiles` / `auth.users` (historically `content_flags.assigned_admin_id` when it equals the deleted profile).
- **Fix:** Apply `20260414120000_repair_fks_for_auth_user_delete.sql`; run `supabase/diagnostics/auth-user-delete-fk-audit.sql` and Postgres logs for `23503`.

---

## Proof (acceptance + test steps)

### Acceptance checklist
- Non-admin cannot access `/admin/*`.
- Admin can:
  - approve client applications (promotion)
  - suspend/reinstate Talent and Career Builder accounts from `/admin/users` (reversible; `profiles.is_suspended`)
  - hard-delete eligible Talent accounts from `/admin/users` (confirmed destructive action)
  - close gigs via moderation

### Manual test steps
- Login as admin → visit `/admin/dashboard`.
- Login as admin → visit `/admin/users` and verify:
  - Career Builder (`client`) rows expose **Suspend User** (when active) and do **not** expose `Delete User`
  - Talent rows expose **Suspend User** (when active) and `Delete User` (confirmation + checkbox required)
  - Admin rows do **not** expose `Delete User`, **Suspend User**, or **Reinstate User**
  - Suspending sets `profiles.is_suspended = true` (optional reason → `suspension_reason`)
  - **Reinstate User** (Suspended tab) sets `is_suspended = false` and clears `suspension_reason`
  - a suspended user is routed to `/suspended` on next protected navigation (existing middleware)
  - hard delete for Career Builder targets fails with explicit guidance to **suspend** instead (API or UI should surface the same policy)
- Approve a `client_applications` row → verify:
  - `client_applications.status='approved'`
  - `profiles.role='client' AND profiles.account_type='client'`
  - `client_profiles` exists
- Retry approve → verify:
  - RPC returns `did_promote=false`
  - no duplicate `client_profiles` rows (still 1)
  - no second approval email is sent (side effects gated in `approveClientApplication()` by `didPromote`)
- Reject a pending application → verify:
  - RPC returns `did_decide=true` then `did_decide=false` on retry
  - rejection email only sends once
- Terminal guards:
  - `rejected → approved` fails deterministically (`P0001` “Cannot approve a rejected application”)
  - `approved → rejected` fails deterministically (`P0001` “Cannot reject an approved application”)

### DB truth proof pack (copy/paste)

```sql
-- Proof 1: idempotent approve + stable promotion
select id, status, user_id
from public.client_applications
where id = '<APP_ID>';

select *
from public.approve_client_application_and_promote('<APP_ID>', 'welcome');

select status, admin_notes
from public.client_applications
where id = '<APP_ID>';

select role, account_type
from public.profiles
where id = (select user_id from public.client_applications where id = '<APP_ID>');

select count(*)
from public.client_profiles
where user_id = (select user_id from public.client_applications where id = '<APP_ID>');

-- Retry (idempotent)
select *
from public.approve_client_application_and_promote('<APP_ID>', 'welcome');

-- Proof 2: terminal guard (rejected can't be approved)
update public.client_applications set status = 'rejected' where id = '<APP_ID>';
select * from public.approve_client_application_and_promote('<APP_ID>', 'x');

-- Proof 3: boundary enforcement (generic admin role toggle cannot promote client)
-- Call `/api/admin/update-user-role` with { userId, newRole: 'client' } => 400
```

### Automated tests
- `tests/admin/admin-functionality.spec.ts` (audited: contains a direct “Change user role → client” test, which is drift vs Role Promotion Boundary; tracked in `docs/DRIFT_REPORT.md`).

---

## Related docs (reference)
- `docs/ADMIN_ACCOUNT_GUIDE.md` (to be merged into this contract)
- `docs/CLIENT_ACCOUNT_FLOW_PRD.md` (product PRD; not authoritative contract)
