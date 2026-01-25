# Infinite Loading Debug Plan

**Date:** January 15, 2025  
**Status:** 📋 DESIGN ONLY  
**Purpose:** Debug infinite loading issue that ONLY occurs in normal Chrome profile (incognito works). Hypothesis: Supabase auth state mismatch or stale cached data causes auth bootstrap to never resolve or causes middleware redirect loop.

---

## STEP 0 — MANDATORY CONTEXT

### Diagrams Used
- **`docs/diagrams/signup-bootstrap-flow.md`** — Used to understand auth → profile bootstrap sequence and identify potential race conditions
- **`docs/diagrams/airport-model.md`** — Used to map debugging instrumentation across Security (middleware), Ticketing (Supabase Auth), Manifest (profiles), and Staff (server actions)

### Key Files Reviewed
- `components/auth/auth-provider.tsx` — Auth state owner, initial session check, profile hydration
- `middleware.ts` — Route protection and redirect logic
- `lib/actions/boot-actions.ts` — Server-side boot state computation
- `app/auth/callback/page.tsx` — OAuth/email verification callback handler
- `app/talent/dashboard/page.tsx` — Server component boot gate
- `app/client/dashboard/page.tsx` — Client component boot gate

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

1. **Middleware = security only** — Middleware must only allow/deny/redirect. No business logic or DB writes. This limits debugging instrumentation to read-only logging and prevents modifying auth state in middleware.

2. **Missing profile is a valid bootstrap state** — Middleware must allow safe routes; changes must prevent redirect loops. Debugging must account for legitimate "profile missing" states during bootstrap without triggering false redirects.

3. **All mutations are server-side** — Server Actions or API Routes only. Debugging instrumentation must not mutate auth state from client components; logging only.

4. **Auth identity ≠ app identity** — `auth.users` is identity; `public.profiles` is application source of truth. Debugging must track both layers separately to identify mismatches.

5. **RLS is final authority** — Never bypass RLS with service role in client/browser code. Debugging queries must respect RLS and use user-level client.

**RED ZONE INVOLVED:** YES

**Red Zone Files:**
- `middleware.ts` — Security/routing spine (read-only instrumentation only)
- `components/auth/auth-provider.tsx` — Auth state owner (critical for loading state)
- `app/auth/callback/page.tsx` — Fragile callback handler
- `lib/actions/boot-actions.ts` — Profile bootstrap logic

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Security Zone (middleware.ts)
**Why:** Middleware controls route access and redirects. Infinite loading could be caused by redirect loops or session/profile mismatches detected here.

**What stays OUT:** No auth state mutations, no DB writes, no business logic changes. Only read-only logging and redirect decision instrumentation.

### Ticketing Zone (Supabase Auth)
**Why:** Auth session state (`auth.users`, cookies, localStorage) is the source of truth for identity. Stale cached sessions in normal Chrome profile could cause mismatches.

**What stays OUT:** No direct session manipulation from debugging code. Only observation and logging of session state.

### Manifest Zone (public.profiles)
**Why:** Profile bootstrap (`ensureProfileExists`, `fetchProfile`) is critical path. Profile fetch failures or `.single()` vs `.maybeSingle()` mismatches could cause infinite loading.

**What stays OUT:** No profile mutations from debugging code. Only query result logging.

### Staff Zone (Server Actions / API Routes)
**Why:** `getBootState()` and `ensureProfileExists()` are server-side truth. These must complete for dashboards to render. Server-side timeouts or errors could cause infinite loading.

**What stays OUT:** No changes to boot logic during debugging phase. Only instrumentation and timeout guards.

### Terminal Zone (Dashboards)
**Why:** Dashboard pages gate on `isLoading` from AuthProvider. If `isLoading` never resolves to `false`, dashboards show infinite loading spinner.

**What stays OUT:** No changes to dashboard rendering logic during debugging. Only timeout UI and error surfacing.

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: Comprehensive Logging + Timeout Guard (RECOMMENDED)

**High-level description:**
Add temporary console + Sentry breadcrumb logging at every critical auth/bootstrap checkpoint, plus an 8-second timeout guard in AuthProvider that surfaces a "Clear session" recovery UI if loading exceeds threshold.

**Files expected to change:**
- `components/auth/auth-provider.tsx` — Add breadcrumbs to `initialSession()`, `fetchProfile()`, `ensureAndHydrateProfile()`, `onAuthStateChange()` handlers. Add timeout guard with recovery UI.
- `middleware.ts` — Add console.info logs (respecting `DEBUG_ROUTING` flag) for session read, profile fetch, redirect decisions.
- `lib/actions/boot-actions.ts` — Add Sentry breadcrumbs to `getBootState()` for ensureProfileExists result, profile query result, nextPath computation.
- `app/talent/dashboard/client.tsx` — Add timeout guard UI component (if client-side boot gate exists).
- `app/client/dashboard/page.tsx` — Add timeout guard UI component for client-side boot gate.

**Data model impact:** None (logging only).

**Key risks:**
- **Redirect loops:** Logging must not trigger redirects. Use read-only instrumentation.
- **Profile bootstrap gaps:** Logging must not interfere with `ensureProfileExists()` retry logic.
- **RLS enforcement:** All logging queries must use user-level client, not service role.
- **Stripe/webhook idempotency:** N/A (not touching Stripe).

**Why this respects Constitution:**
- Middleware remains read-only (logging only)
- No mutations from client components
- RLS respected (user-level queries only)
- Small, reversible diffs

**Why this respects Airport boundaries:**
- Security zone: read-only logging
- Ticketing: observation only
- Manifest: query result logging only
- Staff: instrumentation only
- Terminal: timeout UI only (no logic changes)

---

### Approach B: Minimal Logging + Timeout Guard Only

**High-level description:**
Add timeout guard only (8-second threshold) with "Clear session" recovery UI. Skip comprehensive logging initially, add only if timeout triggers.

**Files expected to change:**
- `components/auth/auth-provider.tsx` — Add timeout guard with recovery UI only.
- `middleware.ts` — No changes (rely on existing `DEBUG_ROUTING` logs).

**Data model impact:** None.

**Key risks:**
- **Less diagnostic data:** If timeout doesn't trigger, root cause remains hidden.
- **Redirect loops:** Timeout UI must not trigger redirects during recovery.

**Why this respects Constitution:**
- Minimal changes, reversible
- No mutations

**Why this respects Airport boundaries:**
- Terminal zone only (timeout UI)

---

### Approach C: Logging + Timeout + Middleware Loop Detection

**High-level description:**
Approach A + explicit middleware redirect loop detection (track redirect chain, detect cycles, break with error UI).

**Files expected to change:**
- All files from Approach A
- `middleware.ts` — Add redirect chain tracking (in-memory map, detect cycles)

**Data model impact:** None (in-memory tracking only).

**Key risks:**
- **Middleware complexity:** Redirect tracking adds complexity to Security zone.
- **Memory leaks:** In-memory tracking must be bounded/cleaned.

**Why this respects Constitution:**
- Middleware remains read-only (tracking is observation)
- No mutations

**Why this respects Airport boundaries:**
- Security zone: read-only tracking

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- **Normal Chrome profile:** After 8 seconds of loading, user sees error UI with "Clear session" button.
- **Incognito:** No timeout UI appears (loading completes normally).
- **Recovery:** Clicking "Clear session" calls `supabase.auth.signOut()` + hard reload, resolves infinite loading.

### Data Correctness
- **Logging:** Console shows chronological sequence:
  1. `[auth.init]` — AuthProvider mount
  2. `[auth.session]` — Session read result (user ID or null)
  3. `[auth.profile.fetch]` — Profile query result (found/missing/error)
  4. `[auth.profile.ensure]` — ensureProfileExists result (created/existed/skipped/error)
  5. `[auth.bootstrap.complete]` — Loading resolved (or timeout)
  6. `[middleware.*]` — Middleware redirect decisions (if `DEBUG_ROUTING=1`)
- **Sentry breadcrumbs:** Same sequence captured in Sentry for production debugging.

### Permissions & Access Control
- **RLS:** All profile queries use user-level client (no service role bypass).
- **No auth mutations:** Debugging code does not modify auth state.

### Failure Cases (What Must NOT Happen)
- **Redirect loops:** Logging must not cause redirects.
- **Profile mutations:** Debugging must not create/update profiles.
- **Service role exposure:** No service role keys in client code.
- **Timeout UI loops:** "Clear session" must not trigger another timeout.

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path (Incognito)
1. Open incognito Chrome.
2. Navigate to `/talent/dashboard` (or `/client/dashboard`).
3. Sign in.
4. **Expected:** Dashboard loads within 2-3 seconds. No timeout UI.

#### Infinite Loading Reproduction (Normal Chrome)
1. Open normal Chrome profile (with existing cookies/localStorage).
2. Navigate to `/talent/dashboard`.
3. Sign in (or if already signed in, refresh page).
4. **Expected:** Loading spinner appears. After 8 seconds, timeout UI appears with "Clear session" button.

#### Recovery Test
1. Trigger timeout UI (step 2 above).
2. Click "Clear session".
3. **Expected:** Page hard reloads, redirects to `/login?signedOut=true`, user can sign in fresh.

#### Console Log Verification
1. Open DevTools Console.
2. Reproduce infinite loading.
3. **Expected:** Console shows chronological sequence:
   - `[auth.init]` timestamp
   - `[auth.session]` with user ID or null
   - `[auth.profile.fetch]` with result
   - `[auth.profile.ensure]` with result (if profile missing)
   - `[auth.bootstrap.complete]` OR `[auth.timeout]` after 8s

#### Middleware Log Verification (if `DEBUG_ROUTING=1`)
1. Set `DEBUG_ROUTING=1` in `.env.local`.
2. Reproduce infinite loading.
3. **Expected:** Server logs show middleware redirect decisions (if redirect loop exists).

### Edge Cases
- **Profile missing:** User has session but no profile row. Logging must show `ensureProfileExists()` retry attempts.
- **Stale session:** Cookies indicate signed-in, but Supabase session expired. Logging must show session read failure.
- **Cross-tab sync:** Another tab signs out. Logging must show `SIGNED_OUT` event.

### Automated Tests (Future)
- **Unit test:** AuthProvider timeout guard triggers after 8s.
- **Integration test:** "Clear session" button calls signOut + reload.
- **E2E test (Playwright):** Normal Chrome profile reproduces timeout, incognito does not.

### RED ZONE Regression Checks
- **Middleware:** Verify no redirect loops introduced (test all role combinations).
- **Auth callback:** Verify callback still redirects correctly after code exchange.
- **Profile bootstrap:** Verify `ensureProfileExists()` still works (no interference from logging).

---

## ROOT CAUSE HYPOTHESIS

Based on code review, most likely causes:

1. **AuthProvider `initialSession()` never resolves:**
   - `supabase.auth.getSession()` hangs (stale cookies/localStorage in normal Chrome)
   - `ensureAndHydrateProfile()` retry loop never completes
   - `isLoading` stuck at `true`

2. **Middleware redirect loop:**
   - Session exists but profile missing → middleware redirects → dashboard tries to load → middleware redirects again
   - Normal Chrome has stale cookies that disagree with Supabase session state

3. **Browser storage mismatch:**
   - Normal Chrome has cached localStorage entries that conflict with server cookies
   - Supabase browser client reads stale localStorage, server reads fresh cookies → mismatch

---

## DELIVERABLES

### Root Cause Found
- Console logs + Sentry breadcrumbs will reveal exact checkpoint where loading stalls.
- Timeout UI confirms infinite loading (not just slow network).

### Exact Patch Diff
- Files + line numbers for:
  1. AuthProvider timeout guard + recovery UI
  2. Sentry breadcrumb additions (5-7 checkpoints)
  3. Console log additions (matching Sentry sequence)
  4. Middleware logging (if `DEBUG_ROUTING=1`)

### Reproduction Steps
- See "Manual Test Steps" above.

### Verification Checklist
- [ ] Timeout UI appears after 8s in normal Chrome
- [ ] Timeout UI does NOT appear in incognito
- [ ] Console logs show complete sequence
- [ ] Sentry breadcrumbs captured (if Sentry configured)
- [ ] "Clear session" resolves infinite loading
- [ ] No redirect loops introduced
- [ ] Profile bootstrap still works
- [ ] Auth callback still works

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**
