# FEATURE: Debug Missing API Key in Supabase REST Requests

**Date:** January 20, 2025  
**Status:** 📋 DESIGN ONLY  
**Purpose:** Debug production bug where browser requests to `/gigs/[id]/apply` route fail with "No API key found in request" error from Supabase REST API.

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed:
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiables and red zone rules
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation structure
- ✅ `database_schema_audit.md` - Schema truth (applications table, RLS policies)
- ✅ `lib/supabase-client.ts` - Server client entrypoint
- ✅ `lib/supabase-admin-client.ts` - Admin client (server-only)
- ✅ `lib/supabase/supabase-browser.ts` - Browser client creation
- ✅ `lib/hooks/use-supabase.ts` - Client hook wrapper
- ✅ `app/gigs/[id]/apply/apply-to-gig-form.tsx` - Affected component
- ✅ `app/gigs/[id]/apply/actions.ts` - Server action (working correctly)

### Diagrams Used:
- **Airport Model** (`docs/diagrams/airport-model.md`) - Used to classify zones:
  - **Terminal Zone**: `/gigs/[id]/apply` page (UI)
  - **Staff Zone**: `applyToGig` server action (mutations)
  - **Locks Zone**: RLS policies on `applications` table

### Key Findings:
1. **Browser client creation** (`lib/supabase/supabase-browser.ts`):
   - Uses `createBrowserClient` from `@supabase/ssr`
   - Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Returns `null` if env vars missing (silent failure)
   - Creates singleton client with cookie-based auth

2. **Client component** (`apply-to-gig-form.tsx`):
   - Uses `useSupabase()` hook
   - Checks for `null` client but may proceed with queries
   - Makes client-side queries: `supabase.from('applications').select('id')`
   - Calls server action `applyToGig()` for actual mutation (correct)

3. **No direct fetch() calls found** - All code uses supabase-js client

4. **Potential issue**: Browser client may be `null` or improperly initialized, causing fallback to raw fetch without headers

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

1. **No DB calls in client components**: Client components should not perform privileged reads or writes. However, **read-only queries for UI state** (like checking if user already applied) are acceptable if using proper RLS-aware client.

2. **RLS is final authority**: All queries must respect RLS policies. The browser client must include proper auth headers (`apikey` + session token) for RLS to work.

3. **Explicit column selection**: No `select('*')` - must select explicit columns. Current code follows this (`select('id')`).

4. **Mutations are server-side only**: All data mutations go through Server Actions or API Routes. ✅ **COMPLIANT** - `applyToGig()` is a server action.

5. **Never bypass RLS with service role in client**: Client code must never import admin client. ✅ **COMPLIANT** - No admin client imports in client components.

**RED ZONE INVOLVED: NO**

This is a **client-side configuration/initialization bug**, not an auth/routing/middleware issue. No red zone files are affected.

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones Touched:

#### **Terminal Zone** (UI Pages & Components)
- **File**: `app/gigs/[id]/apply/apply-to-gig-form.tsx`
- **Responsibility**: Present form UI, collect user input, call server action
- **What stays OUT**: Direct database mutations, admin operations
- **Current Issue**: Client component making read queries with potentially uninitialized/null Supabase client

#### **Staff Zone** (Server Actions / Business Logic)
- **File**: `app/gigs/[id]/apply/actions.ts`
- **Responsibility**: Validate user, check subscription, insert application
- **What stays OUT**: Client-side auth checks, direct browser API calls
- **Status**: ✅ **WORKING CORRECTLY** - Uses server client with proper auth

#### **Locks Zone** (RLS / DB Constraints)
- **Table**: `applications`
- **RLS Policy**: "Talent can apply to gigs" (`talent_id = (SELECT auth.uid())`)
- **Requirement**: Browser client must send `apikey` header + session token
- **Current Issue**: Browser requests missing `apikey` header → RLS can't evaluate → Supabase rejects request

### Zones NOT Touched:
- **Security** (middleware) - No routing/auth changes
- **Ticketing** (Stripe/Auth) - No payment/auth flow changes
- **Control Tower** (Admin/Webhooks) - No admin operations

### Zone Violations to Avoid:
- ❌ **DO NOT** move client-side queries to server components (would break UX - need real-time "already applied" check)
- ❌ **DO NOT** bypass RLS by using admin client in browser
- ✅ **DO** ensure browser client is properly initialized with env vars and headers

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### **Approach A: Runtime Guard + Explicit Error Handling** (RECOMMENDED)

**High-level description:**
Add runtime validation in `createSupabaseBrowser()` to throw explicit error if env vars are missing (instead of returning `null`). Update `useSupabase()` to handle initialization errors gracefully. Add defensive checks in `apply-to-gig-form.tsx` to prevent queries when client is null.

**Files expected to change:**
1. `lib/supabase/supabase-browser.ts`:
   - Add runtime guard that throws if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing
   - Ensure `createBrowserClient` is called with both parameters (no undefined values)

2. `lib/hooks/use-supabase.ts`:
   - Wrap `createSupabaseBrowser()` in try/catch
   - Return `null` only if error is caught (env vars missing)
   - Log error details for debugging

3. `app/gigs/[id]/apply/apply-to-gig-form.tsx`:
   - Add early return if `supabase` is `null` before making queries
   - Show user-friendly error message

**Data model impact:** None

**Key risks:**
- **Low risk**: Runtime guard may break dev environment if env vars not set (but this is desired - fail fast)
- **Mitigation**: Document env var requirements clearly
- **No redirect loops**: Not touching auth/routing
- **No RLS bypass**: Still using proper browser client
- **No webhook issues**: Not touching Stripe

**Why this respects Constitution:**
- ✅ Keeps client queries read-only (checking existing application)
- ✅ Mutations still go through server action
- ✅ RLS remains enforced (client properly initialized)
- ✅ No admin client usage

**Why this respects Airport boundaries:**
- ✅ Terminal zone: UI component handles errors gracefully
- ✅ Staff zone: Unchanged (server action still handles mutations)
- ✅ Locks zone: RLS works correctly once client is initialized

---

### **Approach B: Server-Side Pre-check + Client Fallback**

**High-level description:**
Move "already applied" check to server component (page.tsx), pass result as prop to client component. Client component only calls server action (no client-side queries).

**Files expected to change:**
1. `app/gigs/[id]/apply/page.tsx`:
   - Add server-side check for existing application
   - Pass `alreadyApplied` boolean to client component

2. `app/gigs/[id]/apply/apply-to-gig-form.tsx`:
   - Remove client-side `supabase.from('applications')` query
   - Use prop for `alreadyApplied` state
   - Remove `useSupabase()` hook usage

**Data model impact:** None

**Key risks:**
- **Medium risk**: Slight UX regression - "already applied" check is server-rendered (not real-time)
- **Mitigation**: Server check is sufficient for form validation
- **No redirect loops**: Not touching auth
- **RLS still enforced**: Server component uses server client
- **No webhook issues**: Not touching Stripe

**Why this respects Constitution:**
- ✅ Eliminates client-side DB reads entirely
- ✅ All data access through server components/actions
- ✅ RLS enforced via server client

**Why this respects Airport boundaries:**
- ✅ Terminal zone: Pure presentational component
- ✅ Staff zone: Server component handles data fetching
- ✅ Locks zone: RLS enforced via server client

**Trade-off:** Less real-time UX, but eliminates client-side query entirely.

---

### **Approach C: Debug-Only - Add Logging + Verify Client Initialization**

**High-level description:**
Add comprehensive logging to trace client initialization and request headers. Verify that `createBrowserClient` from `@supabase/ssr` is setting `apikey` header correctly. Check for environment variable mismatches between dev/prod.

**Files expected to change:**
1. `lib/supabase/supabase-browser.ts`:
   - Add console.log for env var presence (dev only)
   - Log client creation success/failure
   - Verify `createBrowserClient` parameters

2. `lib/hooks/use-supabase.ts`:
   - Add logging when client is null
   - Log env var state (without exposing values)

3. `app/gigs/[id]/apply/apply-to-gig-form.tsx`:
   - Add logging before/after Supabase queries
   - Log error details if query fails

**Data model impact:** None

**Key risks:**
- **Low risk**: Logging overhead (dev only)
- **No functional changes**: Only adds observability
- **May reveal root cause**: Could show env var mismatch or client initialization failure

**Why this respects Constitution:**
- ✅ No architectural changes
- ✅ Only adds debugging capability

**Why this respects Airport boundaries:**
- ✅ No zone violations
- ✅ Pure diagnostic approach

**Trade-off:** Doesn't fix the bug, only helps diagnose it. Should be combined with Approach A or B.

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior:
1. ✅ User can navigate to `/gigs/[id]/apply` page
2. ✅ Form displays correctly with cover letter textarea
3. ✅ "Already applied" check works (shows error if user already applied)
4. ✅ Form submission succeeds and redirects to dashboard
5. ✅ Error messages are user-friendly (no technical jargon)

### Data Correctness:
1. ✅ Application is created in `applications` table with correct `gig_id`, `talent_id`, `status='new'`
2. ✅ Duplicate applications are prevented (unique constraint enforced)
3. ✅ Only talent users with active subscriptions can apply (server action validation)

### Permissions & Access Control:
1. ✅ RLS policies are enforced (talent can only see their own applications)
2. ✅ Browser requests include `apikey` header (visible in Network tab)
3. ✅ Browser requests include `Authorization: Bearer <token>` header (session token)
4. ✅ Supabase REST API accepts requests (no "No API key found" error)

### Failure Cases (What Must NOT Happen):
1. ❌ Browser console shows "No API key found in request" error
2. ❌ Network tab shows requests to `rest/v1/applications` without `apikey` header
3. ❌ Client component crashes with "Cannot read property 'from' of null"
4. ❌ Production builds fail due to missing env vars (should fail at build time or runtime with clear error)
5. ❌ Users see generic "Database connection not available" errors

---

## STEP 5 — TEST PLAN

### Manual Test Steps (Happy Path):
1. **Setup**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`
2. **Login**: Sign in as talent user with active subscription
3. **Navigate**: Go to `/gigs/[id]/apply` for an active gig
4. **Verify**: Form loads, no console errors
5. **Check Network**: Open DevTools → Network tab → Filter by "applications"
6. **Verify Headers**: Click on request → Headers tab → Verify `apikey` header is present
7. **Submit**: Fill cover letter, submit form
8. **Verify**: Redirects to dashboard, application created in DB

### Manual Test Steps (Edge Cases):
1. **Missing Env Vars**:
   - Remove `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`
   - Restart dev server
   - Navigate to `/gigs/[id]/apply`
   - **Expected**: Clear error message (not crash), form shows error state

2. **Already Applied**:
   - Apply to a gig successfully
   - Navigate to `/gigs/[id]/apply` again
   - **Expected**: Error message "You have already applied for this gig"

3. **No Subscription**:
   - Login as talent user without active subscription
   - Navigate to `/gigs/[id]/apply`
   - **Expected**: Server action returns error, form shows subscription required message

4. **Network Tab Verification**:
   - Open DevTools → Network tab
   - Filter by "rest/v1"
   - Navigate to `/gigs/[id]/apply`
   - **Expected**: All requests to `rest/v1/applications` include:
     - `apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>` header
     - `Authorization: Bearer <session_token>` header

### Automated Tests to Add/Update:
1. **Unit Test**: `lib/supabase/supabase-browser.ts`
   - Test: `createSupabaseBrowser()` throws if env vars missing
   - Test: `createSupabaseBrowser()` returns client if env vars present
   - Test: Client singleton pattern works correctly

2. **Integration Test**: `app/gigs/[id]/apply/apply-to-gig-form.tsx`
   - Test: Form renders when client is available
   - Test: Form shows error when client is null
   - Test: Form prevents submission when already applied

3. **E2E Test**: Playwright
   - Test: Talent user can apply to gig successfully
   - Test: Duplicate application is prevented
   - Test: Network requests include proper headers

### Explicit RED ZONE Regression Checks:
- ✅ **No redirect loops**: Not touching middleware/auth
- ✅ **No profile bootstrap issues**: Not touching auth provider
- ✅ **No RLS bypass**: Still using browser client (not admin)
- ✅ **No webhook issues**: Not touching Stripe

---

## RECOMMENDATION

**IMPLEMENTED: Approach A + C (Hard Failure + Logging)**

**Rationale:**
- ✅ **Hard failure in production** - No silent breakage, fails immediately if env vars missing
- ✅ **Graceful degradation in dev** - Returns null in dev for testing scenarios
- ✅ **Enhanced error handling** - Guards prevent ghost requests, clear error messages
- ✅ **Production debugging** - Logging helps identify root cause (env var mismatch, stale client)
- ✅ **Cookie fix** - Removed HttpOnly from client-side cookie setting (browser ignores it anyway)
- ✅ **Maintains UX** - Real-time "already applied" check still works

**Key Changes:**
1. `lib/supabase/supabase-browser.ts`: Throws in production if env vars missing, logs in dev
2. `lib/hooks/use-supabase.ts`: Handles errors properly, re-throws in production
3. `app/gigs/[id]/apply/apply-to-gig-form.tsx`: Hard guards prevent null client usage, enhanced error messages

**Next Steps:**
1. ✅ **Code implemented** - Hard failure guards + logging added
2. ⏭️ **Verify Vercel env vars** - Check Production environment has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. ⏭️ **Redeploy** - Environment variable changes require redeploy
4. ⏭️ **Network tab verification** - Check Initiator column to confirm request source
5. ⏭️ **Monitor Sentry** - Should see clear error messages if env vars missing (no more silent failures)
