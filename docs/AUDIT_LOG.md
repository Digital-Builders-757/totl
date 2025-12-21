# Audit Log (Append-Only Proof Ledger)

**Date:** December 21, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Append-only receipts: timestamp + environment + exact command/steps + outcome. Queue lives in `docs/AUDIT_MASTER_BOARD.md`.

---

## Log entries

### 2025-12-21 12:15:00 -05:00 — Decision recorded (AUTH REQUIRED)

- **Decision:** Career Builder application requires authentication.
- **Law changes planned:** remove `/client/apply`, `/client/apply/success`, `/client/application-status` from `PUBLIC_ROUTES`; remove anon insert policy on `client_applications`; enforce `user_id = auth.uid()` ownership policies.
- **Tracker:** `docs/AUDIT_MASTER_BOARD.md` (**D3** and drift **6.1**)

### 2025-12-21 14:10:00 -05:00 — P2 (PASS)

- **ID**: P2
- **Environment**: local Supabase (`http://127.0.0.1:54321`) + Playwright `next start`
- **Command**:

```text
npx playwright test tests/admin/career-builder-approval-pipeline.spec.ts --project=chromium --retries=0 --reporter=list
```

- **Outcome**: ✅ PASS — submit → approve → promoted user routes to `/client/dashboard` → status portal shows approved + notes.

### 2025-12-21 14:18:00 -05:00 — P1 (PASS)

- **ID**: P1
- **Environment**: local Supabase (`http://127.0.0.1:54321`) + Playwright `next start`
- **Command**:

```text
npx playwright test tests/integration/booking-accept.spec.ts --project=chromium --retries=0 --reporter=list
```

- **Outcome**: ✅ PASS — client accepts application via UI → booking created (DB verified).

### 2025-12-21 11:46:48 -05:00 — P2 (FAILED / BLOCKED)

- **ID**: P2
- **Environment**: `localhost:3000` via Playwright `next start` (fresh build)
- **Command**:

```text
npx playwright test tests/admin/career-builder-approval-pipeline.spec.ts --project=chromium --retries=0 --reporter=list
```

- **Outcome**: ❌ FAIL — client application submission does not complete (no redirect to `/client/apply/success`)
- **Failure signature (high-signal)**:
  - `permission denied for table users` while querying `client_applications` under authenticated context
  - Evidence: Playwright run output includes:

```text
Error checking existing client application: { code: '42501', message: 'permission denied for table users' }
```

- **Likely root cause (evidence-backed)**: `client_applications` RLS policies reference `auth.users` (forbidden for `authenticated` role), causing 42501.
  - Evidence: `supabase/migrations/20251209095547_fix_client_applications_rls_for_authenticated_users.sql`:

```text
AND LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
```

- **Next action (minimal)**:
  - Replace the policy check with a non-`auth.users` mechanism (prefer `user_id = auth.uid()` since `client_applications.user_id` exists per `20251220130000_client_application_promotion_rpc.sql`)
  - Re-run this command; then add assertions for `/client/application-status` pre/post approval (already authored in the spec)

---

### 2025-12-21 11:46:48 -05:00 — P1 (FAILED / BLOCKED)

- **ID**: P1
- **Environment**: `localhost:3000` via Playwright `next start` (fresh build)
- **Command**:

```text
npx playwright test tests/integration/booking-accept.spec.ts --project=chromium --retries=0 --reporter=list
```

- **Outcome**: ❌ FAIL — cannot reach “client accepts application → booking created” because the Career Builder application submission step fails first.
- **Failure signature (high-signal)**:

```text
Error checking existing client application: { code: '42501', message: 'permission denied for table users' }
```

- **Likely root cause**: same as **P2** (broken `client_applications` RLS policy referencing `auth.users`).
- **Next action (minimal)**:
  - Fix the RLS policy first (Locks zone) and re-run **P1**.


