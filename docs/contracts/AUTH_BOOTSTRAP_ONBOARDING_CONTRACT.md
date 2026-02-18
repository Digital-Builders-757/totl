# Auth Bootstrap + Onboarding Contract

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS (authoritative; fill remaining UNVERIFIED items)  
**Purpose:** Define the enforceable contract for: session → profile bootstrap → routing, and the onboarding-safe gaps that must never produce redirect loops.

> This doc is **Layer 2**. It does not restate Layer 1 laws. It links to them.

---

## Layer 1 links (laws + wiring)
- Laws: `docs/ARCHITECTURE_CONSTITUTION.md`
- Canonical modules: `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- Diagrams:
  - `docs/diagrams/signup-bootstrap-flow.md`
  - `docs/diagrams/infrastructure-flow.md`

---

## Routes involved (exact paths)

### Public/auth-safe
- `/login`
- `/choose-role`
- `/reset-password`
- `/update-password`
- `/verification-pending`
- `/auth/callback`

### Bootstrap-sensitive
- `/talent/dashboard`
- `/client/dashboard`
- `/admin/dashboard`
- `/onboarding/select-account-type`

### Public prefix behavior (verified)
- `/talent/[slug]` is treated as public by `isPublicPath()`.
- `/talent/dashboard`, `/talent/profile`, `/talent/settings/*`, `/talent/subscribe/*` are treated as protected (not public) by `isPublicPath()` and are protected by `needsTalentAccess()`.
- `/gigs/[id]` is treated as public by `isPublicPath()` (via `PUBLIC_ROUTE_PREFIXES`).

**Verified:** Auth routes are top-level and enumerated by `AUTH_ROUTES` + `isAuthRoute()` in `lib/constants/routes.ts`, and middleware uses `isAuthRoute(path) || isPublicPath(path) || path === ONBOARDING_PATH` as the signed-out allowlist.

**Evidence**
- `lib/constants/routes.ts`: `PATHS`, `AUTH_ROUTES`, `isAuthRoute()`, `isPublicPath()`
- `lib/utils/route-access.ts`: `needsTalentAccess()`
- `middleware.ts`: signed-out allowlist uses `isAuthRoute`, `isPublicPath`, `ONBOARDING_PATH`

### Non-negotiable auth-route source of truth (added Feb 17, 2026)
- `AUTH_ROUTES` + `isAuthRoute()` in `lib/constants/routes.ts` are the **only** source of truth for auth-safe routes.
- Client bootstrap logic in `components/auth/auth-provider.tsx` **must not hardcode** auth route lists.
- Required invariant:
  - If middleware uses `isAuthRoute(path)` for signed-out allowlist, client bootstrap must mirror that via `isAuthRoute(path)` for no-session handling.
- Reason: two diverging route lists caused `/choose-role` to be treated as protected in client bootstrap and created `/choose-role -> /login` bounce loops.

### Password-reset token transport modes (added Feb 17, 2026)
- `/update-password` must support both token delivery formats:
  1. Query params (for example: `?token_hash=...&type=recovery`)
  2. URL hash fragments (for example: `#access_token=...&refresh_token=...&type=recovery`)
- Server components cannot read URL hash fragments; any hash-token recovery path must include a client-side gate that exchanges/stores the session before rendering the reset form.
- Do not redirect immediately to `/login` just because query tokens are missing; this breaks valid hash-token links.

### Signed-in recovery exception for `/update-password` (added Feb 18, 2026)
- `/update-password` remains in `AUTH_ROUTES` and is still an auth route by policy.
- During active password recovery intent, redirect owners must treat `/update-password` as a terminal-like exception and allow the page to remain in place after `SIGNED_IN`.
- Recovery intent is intentionally scoped and short-lived:
  - client gate sets a timestamped sessionStorage marker before `setSession()` / `verifyOtp()`
  - URL is normalized to include `?recovery=1` after successful hash exchange
  - marker is cleared on successful password update (and expired by TTL in auth provider)
- Required invariant:
  - AuthProvider and middleware must preserve this exception narrowly for `/update-password` recovery only; they must not relax signed-in auth-route redirects globally.

---

## Canonical code paths (winners)

### Middleware gates (Security)
- `middleware.ts`
  - Reads: `auth.getUser()` and `profiles(role, account_type, is_suspended)`.
  - Uses canonical helpers:
    - `lib/constants/routes.ts` (`isAuthRoute`, `isPublicPath`, `PATHS`)
    - `lib/utils/route-access.ts`
    - `lib/routing/decide-redirect.ts`

### Server-side bootstrap / repair (Staff)
- `lib/actions/auth-actions.ts`
  - `ensureProfileExists()`
  - `ensureProfilesAfterSignup()`
  - `handleLoginRedirect(returnUrl?: string)`

### Database bootstrap (Locks / Control Tower)
- Migration (authoritative): `supabase/migrations/20251216190000_auth_bootstrap_contract_handle_new_user.sql`
  - Trigger: `on_auth_user_created` on `auth.users`
  - Function: `public.handle_new_user()`
  - Guarantees: new users become **Talent** in app identity.

### Client promotion (Admin-only)
- `lib/actions/client-actions.ts`
  - `approveClientApplication(applicationId: string, adminNotes?: string)`

### Role Promotion Boundary (hard security rule)
- **MUST NOT:** Any onboarding/UI/server action may write `profiles.role` or `profiles.account_type` from user-submitted input.
- **ONLY allowed writes:**
  1. DB bootstrap trigger `public.handle_new_user()` sets initial `role/account_type` to `talent`.
  2. Admin-only promotion path `approveClientApplication()` updates `role/account_type` to `client` (and creates `client_profiles` if applicable).
  3. Admin-only creation path for `admin` users happens **only** via Supabase backend (no UI).
- **Detection checklist (must pass before merge):**
  - Repo-wide search for `.update({ role:` or `.update({ account_type:` and confirm every hit is one of the allowed paths above.

---

## Data model touched (tables / functions / columns)

### `public.profiles`
- Used columns (observed in code):
  - `id`
  - `role`
  - `account_type`
  - `display_name`
  - `email_verified`
  - `avatar_url`, `avatar_path`
  - `subscription_status`, `subscription_plan`, `subscription_current_period_end`
  - `stripe_customer_id`, `stripe_subscription_id`
  - `is_suspended`, `suspension_reason`

**Evidence:**
- `types/database.ts` (`public.Tables.profiles.Row`)
- `middleware.ts` selects `role, account_type, is_suspended`.
- `lib/actions/auth-actions.ts` selects and writes `role/account_type/display_name/email_verified`.

### `public.talent_profiles`
- Used columns (observed):
  - `user_id`, `first_name`, `last_name` (+ optional fields)

### `public.client_applications`
- Used columns (observed):
  - `id`, `user_id`, `status`, `admin_notes`, `first_name`, `last_name`, `email`, `company_name`, `industry`, `phone`, `website`, `business_description`, `needs_description`, `created_at`

### `public.client_profiles`
- Used columns (observed):
  - `user_id`, `company_name`, `website`, `contact_email`, `contact_name`, `contact_phone`, `industry`, `company_size`

### DB functions/triggers
- `public.handle_new_user()` (bootstrap)
- `public.sync_profiles_email_verified_from_auth_users()` (**VERIFIED**; see `supabase/migrations/20251216013000_sync_profiles_email_verified_on_auth_confirm.sql`)

### Email verification state propagation (verified)
- **Guarantee:** `public.profiles.email_verified` is kept in sync with `auth.users.email_confirmed_at`.
- **Mechanism:** trigger `on_auth_user_email_confirmed` calls `public.sync_profiles_email_verified_from_auth_users()` on updates to `auth.users.email_confirmed_at`.
- **Evidence:** `supabase/migrations/20251216013000_sync_profiles_email_verified_on_auth_confirm.sql`

---

## RLS truth (effective policies from migrations)

**RLS enabled evidence**
- `supabase/migrations/20250101000000_consolidated_schema.sql` enables RLS for:
  - `profiles`, `talent_profiles`, `client_profiles`, `client_applications`
- `supabase/migrations/20251209095547_fix_client_applications_rls_for_authenticated_users.sql` re-enables RLS for `public.client_applications` (defensive) and redefines insert/select policies.

> Postgres evaluates RLS policies with **OR** semantics per operation: if *any* policy allows, the row is accessible.

### `public.profiles` — policies

| Policy name | Operation | Role(s) | USING predicate | WITH CHECK predicate | Migration |
|---|---|---|---|---|---|
| `Users can view own profile` | SELECT | authenticated | `auth.uid() = id` | — | `20250101000001_rls_policies.sql` |
| `Public profiles view` | SELECT | anon, authenticated | `true` | — | `20251024182916_fix_rls_policies_only.sql` |
| `Users can update own profile` | UPDATE | authenticated | `auth.uid() = id` | — | `20250101000001_rls_policies.sql` |
| `Update own profile` | UPDATE | authenticated | `id = (SELECT auth.uid())` | — | `20251016172507_fix_performance_advisor_warnings.sql` |
| `Insert profile by user or service` | INSERT | PUBLIC (effectively authenticated only) | — | `id = (SELECT auth.uid())` | `20251016172507_fix_performance_advisor_warnings.sql` |

**Removed policy (recursion fix)**
- `Admins can view all profiles` was dropped because it caused `SQLSTATE 42P17` (self-referential policy on `profiles`).
- Migration: `supabase/migrations/20251220131212_drop_recursive_profiles_admin_policy.sql`

**Net effect**
- **SELECT:** public (anon) can select **all rows** (`Public profiles view`).
- **UPDATE:** authenticated users can update **only their row**.
- **INSERT:** authenticated users can insert **only a row with `id = auth.uid()`**.
- **DELETE:** **no** delete policy in migrations → delete is denied under RLS.

**Security implication (must be explicitly acknowledged in contracts/journeys)**
- RLS does **not** restrict columns. Since anon can SELECT all rows, **public reads must use explicit safe column lists**; never select sensitive columns on public routes.

### `public.talent_profiles` — policies

| Policy name | Operation | Role(s) | USING predicate | WITH CHECK predicate | Migration |
|---|---|---|---|---|---|
| `Users can view own talent profile` | SELECT | authenticated | `auth.uid() = user_id` | — | `20250101000001_rls_policies.sql` |
| `Clients can view talent profiles` | SELECT | authenticated | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'client')` | — | `20250101000001_rls_policies.sql` |
| `Admins can view all talent profiles` | SELECT | authenticated | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` | — | `20250101000001_rls_policies.sql` |
| `Public talent profiles view` | SELECT | anon, authenticated | `true` | — | `20251024182916_fix_rls_policies_only.sql` |
| `Users can update own talent profile` | UPDATE | authenticated | `auth.uid() = user_id` | — | `20250101000001_rls_policies.sql` |
| `Update own talent profile` | UPDATE | authenticated | `user_id = (SELECT auth.uid())` | — | `20251016172507_fix_performance_advisor_warnings.sql` |
| `Users can insert own talent profile` | INSERT | authenticated | — | `auth.uid() = user_id` | `20250101000001_rls_policies.sql` |
| `Insert own talent profile` | INSERT | authenticated | — | `user_id = (SELECT auth.uid())` | `20251016172507_fix_performance_advisor_warnings.sql` |

**Net effect**
- **SELECT:** public (anon) can select **all rows** (`Public talent profiles view`).
- **UPDATE/INSERT:** authenticated users can write **only their row**.
- **DELETE:** **no** delete policy in migrations → delete is denied under RLS.

### `public.client_profiles` — policies

| Policy name | Operation | Role(s) | USING predicate | WITH CHECK predicate | Migration |
|---|---|---|---|---|---|
| `Users can view own client profile` | SELECT | authenticated | `auth.uid() = user_id` | — | `20250101000001_rls_policies.sql` |
| `Admins can view all client profiles` | SELECT | authenticated | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` | — | `20250101000001_rls_policies.sql` |
| `Client profiles view` | SELECT | authenticated | `true` | — | `20251024182916_fix_rls_policies_only.sql` |
| `Users can update own client profile` | UPDATE | authenticated | `auth.uid() = user_id` | — | `20250101000001_rls_policies.sql` |
| `Update own client profile` | UPDATE | authenticated | `user_id = (SELECT auth.uid())` | — | `20251016172507_fix_performance_advisor_warnings.sql` |
| `Users can insert own client profile` | INSERT | authenticated | — | `auth.uid() = user_id` | `20250101000001_rls_policies.sql` |
| `Client profile insert policy` | INSERT | authenticated | — | `user_id = (SELECT auth.uid())` | `20251016172507_fix_performance_advisor_warnings.sql` |

**Net effect**
- **SELECT:** any authenticated user can select **all rows** (`Client profiles view`).
- **UPDATE/INSERT:** authenticated users can write **only their row**.
- **DELETE:** **no** delete policy in migrations → delete is denied under RLS.

### `public.client_applications` — policies

| Policy name | Operation | Role(s) | USING predicate | WITH CHECK predicate | Migration |
|---|---|---|---|---|---|
| `Admins can view client applications` | SELECT | authenticated | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` | — | `20250101000001_rls_policies.sql` (also ensured by `20251118001558_add_admin_application_policies.sql`) |
| `Authenticated users can view own client applications` | SELECT | authenticated | `LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))` | — | `20251209095547_fix_client_applications_rls_for_authenticated_users.sql` |
| `Admins can manage client applications` | ALL (INSERT/UPDATE/DELETE/SELECT) | authenticated | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` | same admin check | `20250101000001_rls_policies.sql` (also ensured by `20251118001558_add_admin_application_policies.sql`) |
| `Authenticated users can insert own client applications` | INSERT | authenticated | — | `LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))` | `20251209095547_fix_client_applications_rls_for_authenticated_users.sql` |
| `Public can insert client applications` | INSERT | anon | — | `true` | `20251209095547_fix_client_applications_rls_for_authenticated_users.sql` (replaces earlier same-named policy from `20250101000001_rls_policies.sql`) |

**Net effect**
- **INSERT:** anon can insert; authenticated can insert *only if inserted email matches their auth email*; admins can insert via admin policy.
- **SELECT:** authenticated users can select *only their own* applications via email match; admins can select all.
- **UPDATE/DELETE:** admin-only (via `Admins can manage client applications`).

---

## Known failure modes (symptoms → likely cause)

1) **Redirect loop between `/login` and a dashboard**
- Symptom: user hits `/login`, immediately redirected to dashboard, then back.
- Likely cause: middleware thinks user is signed-in but profile/routing state is inconsistent (or signedOut handling misfires).

2) **“User exists but profile missing” limbo**
- Symptom: authenticated user gets redirected to `/login` when trying to access a protected route.
- Likely cause: trigger didn’t create profile or profile was manually deleted.
- Canonical repair: `ensureProfileExists()`.

3) **Split-brain routing (auth callback vs dashboards vs client provider)**
- Symptom: user briefly lands on the wrong terminal, bounces between routes, or onboarding logic differs between server and client.
- Likely cause: multiple independent layers “guess” destination from partial data.
- Canonical fix: server-owned **BootState** determines `needsOnboarding` + `nextPath` in one place, and callers redirect to that.

4) **Create-account bounce (`/choose-role` -> `/login`)**
- Symptom: clicking “Create an account” lands on `/choose-role` then immediately returns to `/login`.
- Likely cause: client bootstrap `isProtectedPath()` hardcoded auth routes and treated `/choose-role` as protected while middleware allowed it as auth-safe.
- Canonical fix: use `isAuthRoute(path)` in client bootstrap and middleware, never duplicate auth route lists.

5) **Reset link lands on login instead of password form**
- Symptom: clicking password reset email goes to login instead of allowing password update.
- Likely cause: `/update-password` expected query token only and redirected on missing query params even when valid hash tokens were present.
- Canonical fix: support hash-token recovery with client-side gate before rendering `UpdatePasswordForm`.

---

## BootState (server-owned routing truth) — ✅ IMPLEMENTED

**Contract:**
- The app must be able to answer deterministically after any session establishment (login/callback/refresh):
  - who the user is
  - what terminal they belong to
  - whether they need onboarding/profile completion
  - what the next safe route is

**Winner (Staff):**
- `lib/actions/boot-actions.ts`
  - `getBootState()`: read-only routing truth (`needsOnboarding`, `nextPath`)
  - `finishOnboardingAction()`: single “commit” for talent profile completion (no role escalation)

**Non-negotiables preserved:**
- No middleware DB writes
- No client DB writes
- No role escalation (client is admin-promoted only)

3) **Client privilege escalation during onboarding (SECURITY BUG)**
- Symptom: a user becomes `role=client` without admin approval.
- Likely cause: off-sync onboarding actions writing `profiles.role` directly.
- **Declared winner:** auth bootstrap contract; anything else is off-sync (see `docs/OFF_SYNC_INVENTORY.md`).

---

## Proof (acceptance checklist + test steps)

### Acceptance checklist
- Signing up creates:
  - `profiles(role='talent', account_type='talent')`
  - `talent_profiles(user_id=auth.uid())`
- Accessing `/talent/dashboard` with a session but missing profile does not hard-loop; the system can repair.
- Client promotion happens only through admin approval.

### Proof queries (dev-only; copy/paste runnable)

#### After signup + email confirm

```sql
-- 1) Profiles row exists + defaults
SELECT id, role, account_type, email_verified
FROM public.profiles
WHERE id = auth.uid();

-- Assert:
-- - role = 'talent'
-- - account_type = 'talent'
-- - email_verified = true (after confirmation)

-- 2) Talent profile exists
SELECT user_id
FROM public.talent_profiles
WHERE user_id = auth.uid();
```

#### After profile deletion + repair

```sql
-- DEV-ONLY: delete the row to simulate drift
DELETE FROM public.profiles WHERE id = auth.uid();

-- Log in / hit a bootstrap-safe route so repair runs, then assert again:
SELECT id, role, account_type
FROM public.profiles
WHERE id = auth.uid();

SELECT user_id
FROM public.talent_profiles
WHERE user_id = auth.uid();
```

#### After client application approval (promoted state)

```sql
-- After admin approves the application for this user:
SELECT id, role, account_type
FROM public.profiles
WHERE id = auth.uid();

-- Assert:
-- - role = 'client'
-- - account_type = 'client'

SELECT user_id
FROM public.client_profiles
WHERE user_id = auth.uid();
```

### Redirect convergence (no loops)
- **Assert:** Any post-auth navigation reaches its terminal destination within **≤ 2 redirects** (no loops).
  - Evidence pointers for redirect logic: `middleware.ts` + `lib/routing/decide-redirect.ts`.

### Manual test steps
- Create a talent account → confirm email flow → reach talent dashboard.
- Delete `public.profiles` row for a user (dev-only) → log in → confirm repair path creates it.
- Submit Career Builder application → approve as admin → confirm role/account_type promoted.
- From `/login`, click **Create an account** and verify `/choose-role` does not bounce back to `/login`.
- Trigger password reset email and verify both query-token and hash-token recovery links reach `/update-password` without forced redirect to `/login`.
- While processing a valid hash recovery link, verify `SIGNED_IN` does not bounce `/update-password` to a dashboard/login before password submission.
- Refresh on `/update-password` during active recovery intent and verify middleware allows page continuity (no auth-route bounce).

### Automated tests
- Playwright coverage is tracked in: `docs/tests/AUTH_BOOTSTRAP_TEST_MATRIX.md` (this removes ambiguity and explicitly marks gaps).

---

## Related docs (reference; not authoritative)
- `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md`
- `docs/SIGN_OUT_IMPROVEMENTS.md`
- `docs/AUTH_EMAIL_VERIFICATION_TRACE.md`
