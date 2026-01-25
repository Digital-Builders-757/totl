# Plan: Fix Cursor Bugbot Issues (PR #130)

**Date:** January 19, 2026  
**Status:** DESIGN ONLY  
**Purpose:** Fix 3 medium-severity issues identified by Cursor Bugbot in PR #130

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiable architectural boundaries
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation spine
- ✅ `database_schema_audit.md` - Schema truth (no schema changes needed)
- ✅ `app/client/dashboard/page.tsx` - Client dashboard (Issue #1)
- ✅ `app/gigs/[id]/apply/apply-to-gig-form.tsx` - Application form (Issue #2)
- ✅ `app/talent/dashboard/client.tsx` - Talent dashboard (Issue #3)
- ✅ `lib/hooks/use-supabase.ts` - Supabase hook implementation

### Canonical Mental Model
- ✅ `docs/diagrams/airport-model.md` - Airport architecture zones

### Selected Diagrams (and WHY)
- **Airport Model** (`docs/diagrams/airport-model.md`): All three issues are in **Terminal** zone (UI dashboards/components). No Security, Ticketing, or Control Tower changes needed.

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 1. **No DB calls in client components**
- **Rule:** Client components must not write to DB; no privileged reads.
- **Impact:** All fixes are UI/error handling only. No database queries or mutations added.

### 2. **Browser client initialization**
- **Rule:** `createSupabaseBrowser()` must be initialized in `useEffect`, `useLayoutEffect`, or event handlers, never during render.
- **Impact:** Issue #3 touches `useSupabase()` hook usage in `useEffect` dependencies. Must respect hook's null → non-null transition pattern.

### 3. **All mutations are server-side**
- **Rule:** Server Actions or API Routes only for mutations.
- **Impact:** Issue #2 is in form submission (already uses server action). Fix is error handling only.

### 4. **RLS is final authority**
- **Rule:** Never bypass RLS with service role in client/browser code.
- **Impact:** No RLS changes needed. Fixes are error display/recovery only.

### 5. **Prefer small diffs**
- **Rule:** Especially in red flag files.
- **Impact:** All fixes are minimal, focused changes. No architectural refactoring.

### RED ZONE INVOLVED: **NO**
- None of these issues touch middleware, auth/callback, profile bootstrap, Stripe webhooks, or RLS policies.
- All fixes are in Terminal zone (UI components) with error handling improvements.

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones Touched

#### **Terminal Zone** (UI Pages & Components)
- **Why:** All three issues are in client-side React components:
  - `app/client/dashboard/page.tsx` - Client dashboard UI
  - `app/gigs/[id]/apply/apply-to-gig-form.tsx` - Application form UI
  - `app/talent/dashboard/client.tsx` - Talent dashboard UI
- **Responsibility:** Display errors to users, handle loading states, manage form submission state.
- **Must NOT:** Perform database writes, bypass RLS, or contain business logic.

### Zones NOT Touched
- **Security (middleware)**: No routing/auth changes
- **Staff (server actions)**: No server-side logic changes
- **Ticketing (Stripe)**: No billing changes
- **Locks (RLS)**: No policy changes
- **Control Tower (admin/webhooks)**: No admin/automation changes

### Zone Violations to Avoid
- ❌ Do NOT add database queries in client components
- ❌ Do NOT bypass error handling to call server actions directly
- ❌ Do NOT modify `useSupabase()` hook implementation (only fix usage)

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Issue #1: Client Dashboard Error State Not Displayed

**Problem:** `supabaseError` state is set on line 247 but never rendered in UI. Users see empty dashboard with no error indication.

**Approach A: Add Error Display Component (RECOMMENDED)**
- **Description:** Add error display banner/alert when `supabaseError` is set, similar to talent dashboard pattern.
- **Files Changed:**
  - `app/client/dashboard/page.tsx` - Add error display after ProfileCompletionBanner (around line 454)
- **Data Model Impact:** None
- **Key Risks:**
  - Low risk - purely UI addition
  - Must ensure error display doesn't break layout on mobile
- **Constitution Compliance:** ✅ UI-only change, respects Terminal zone boundaries

**Approach B: Remove Unused State**
- **Description:** Remove `supabaseError` state entirely if errors are handled elsewhere.
- **Files Changed:**
  - `app/client/dashboard/page.tsx` - Remove state declaration and setSupabaseError calls
- **Data Model Impact:** None
- **Key Risks:**
  - Higher risk - removes error tracking capability
  - May hide legitimate errors from users
- **Constitution Compliance:** ✅ But reduces observability

**Recommendation:** **Approach A** - Display errors to users for better UX and debugging.

---

### Issue #2: Unwrapped Sentry Import Leaves Form Stuck

**Problem:** Dynamic `import("@sentry/nextjs")` on line 167 in catch block is not wrapped in try-catch. If import fails, `setError()` and `setSubmitting(false)` never execute, leaving form stuck.

**Approach A: Wrap Sentry Import in Try-Catch (RECOMMENDED)**
- **Description:** Wrap Sentry import and capture in try-catch block, ensuring error handling always completes.
- **Files Changed:**
  - `app/gigs/[id]/apply/apply-to-gig-form.tsx` - Wrap lines 167-182 in try-catch
- **Data Model Impact:** None
- **Key Risks:**
  - Low risk - defensive error handling
  - Must ensure `setError()` and `setSubmitting(false)` always execute
- **Constitution Compliance:** ✅ Error handling improvement, no business logic changes

**Approach B: Use Static Import**
- **Description:** Change to static import at top of file instead of dynamic import.
- **Files Changed:**
  - `app/gigs/[id]/apply/apply-to-gig-form.tsx` - Move Sentry import to top, remove dynamic import
- **Data Model Impact:** None
- **Key Risks:**
  - May increase bundle size (Sentry loaded even when not needed)
  - Less optimal for code splitting
- **Constitution Compliance:** ✅ But less optimal than dynamic import

**Recommendation:** **Approach A** - Keep dynamic import but wrap in try-catch for safety. Matches pattern used in talent dashboard (lines 229-248).

---

### Issue #3: Incorrect Dependency Exclusion Causes Data Loading Failure

**Problem:** `supabase` is excluded from `useEffect` dependencies (line 368-379) with comment claiming it's "memoized singleton, never changes". However, `useSupabase()` returns `null` initially, then changes to non-null client after mount. If effect runs with `supabase === null`, it returns early. When `supabase` becomes non-null, effect won't re-run, leaving dashboard stuck in loading state.

**Approach A: Include `supabase` in Dependencies (RECOMMENDED)**
- **Description:** Add `supabase` to dependency array. Effect will re-run when `supabase` transitions from null to non-null.
- **Files Changed:**
  - `app/talent/dashboard/client.tsx` - Add `supabase` to dependency array (line 373-379)
- **Data Model Impact:** None
- **Key Risks:**
  - Low risk - corrects dependency tracking
  - May cause extra re-render when supabase initializes (acceptable)
  - Matches pattern used in client dashboard (line 264)
- **Constitution Compliance:** ✅ Correct React hooks usage, respects hook's null → non-null pattern

**Approach B: Use `supabase !== null` Guard in Effect**
- **Description:** Keep dependency exclusion but add explicit check for `supabase !== null` before early return.
- **Files Changed:**
  - `app/talent/dashboard/client.tsx` - Modify early return condition (line 112)
- **Data Model Impact:** None
- **Key Risks:**
  - Higher risk - doesn't fix root cause (effect won't re-run when supabase becomes non-null)
  - Still leaves potential race condition
- **Constitution Compliance:** ✅ But doesn't fully solve the problem

**Approach C: Use Ref to Track Supabase Initialization**
- **Description:** Use ref to track if supabase has been initialized, trigger effect manually.
- **Files Changed:**
  - `app/talent/dashboard/client.tsx` - Add ref tracking and manual effect trigger
- **Data Model Impact:** None
- **Key Risks:**
  - Higher complexity
  - Over-engineered solution
  - May introduce new bugs
- **Constitution Compliance:** ✅ But unnecessarily complex

**Recommendation:** **Approach A** - Include `supabase` in dependencies. This is the correct React pattern and matches the client dashboard implementation.

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### Issue #1: Client Dashboard Error Display
- ✅ When `fetchDashboardData` catches an error, `supabaseError` is set
- ✅ Error message is displayed to user in visible location (banner/alert)
- ✅ Error display doesn't break layout on mobile devices
- ✅ Error display includes retry/refresh action
- ✅ Error display matches design system (uses Alert component or similar)

### Issue #2: Sentry Import Error Handling
- ✅ When Sentry import fails, form still shows error message to user
- ✅ Form `submitting` state is always cleared, even if Sentry import fails
- ✅ User can retry form submission after error
- ✅ Error handling pattern matches talent dashboard (wrapped in try-catch)

### Issue #3: Talent Dashboard Data Loading
- ✅ Dashboard loads data when `supabase` transitions from null to non-null
- ✅ No infinite loading spinner when supabase initializes
- ✅ Effect re-runs when supabase becomes available
- ✅ Dependency array includes `supabase` (matches client dashboard pattern)

### Failure Cases (What Must NOT Happen)
- ❌ Users see empty dashboard with no error indication (Issue #1)
- ❌ Form stuck in "submitting" state requiring page refresh (Issue #2)
- ❌ Dashboard stuck in loading state when supabase initializes (Issue #3)
- ❌ New errors introduced in error handling paths
- ❌ Layout breaks on mobile devices
- ❌ Performance regressions from extra re-renders

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Issue #1: Client Dashboard Error Display
1. **Happy Path:**
   - Log in as client
   - Navigate to `/client/dashboard`
   - Verify dashboard loads normally
   - Verify no error banner displayed when data loads successfully

2. **Error Path:**
   - Simulate network error (disable network in DevTools)
   - Navigate to `/client/dashboard`
   - Verify error banner appears with message "Failed to load dashboard data. Please try again."
   - Verify retry/refresh button is visible and functional
   - Re-enable network and click retry
   - Verify dashboard loads successfully

3. **Edge Cases:**
   - Test on mobile viewport (error banner doesn't break layout)
   - Test with multiple rapid errors (error state updates correctly)
   - Test with partial data load (some queries succeed, some fail)

#### Issue #2: Sentry Import Error Handling
1. **Happy Path:**
   - Navigate to gig application page
   - Fill out cover letter
   - Submit application
   - Verify form submits successfully
   - Verify form `submitting` state clears after success

2. **Error Path:**
   - Navigate to gig application page
   - Fill out cover letter
   - Simulate Sentry import failure (mock `import()` to reject)
   - Submit application with network error
   - Verify error message displayed to user
   - Verify form `submitting` state is cleared (button becomes enabled)
   - Verify user can retry submission

3. **Edge Cases:**
   - Test with Sentry completely unavailable (module not found)
   - Test with Sentry import timeout
   - Test with multiple rapid submissions (state management correct)

#### Issue #3: Talent Dashboard Data Loading
1. **Happy Path:**
   - Log in as talent
   - Navigate to `/talent/dashboard`
   - Verify dashboard loads data successfully
   - Verify no infinite loading spinner

2. **Initialization Path:**
   - Clear browser cache/cookies
   - Log in as talent
   - Navigate to `/talent/dashboard`
   - Verify loading spinner appears briefly
   - Verify dashboard loads when supabase initializes
   - Verify data appears correctly

3. **Edge Cases:**
   - Test with slow network (supabase initialization delayed)
   - Test with auth state pre-loaded (supabase available immediately)
   - Test with multiple rapid navigations (no duplicate data fetches)

### Automated Tests to Add/Update

#### Issue #1: Client Dashboard Error Display
- **File:** `tests/client/client-functionality.spec.ts` (or create new test)
- **Test:** "displays error banner when dashboard data fetch fails"
- **Steps:**
  1. Mock Supabase client to reject queries
  2. Navigate to client dashboard
  3. Assert error banner is visible
  4. Assert error message contains "Failed to load dashboard data"
  5. Assert retry button is present

#### Issue #2: Sentry Import Error Handling
- **File:** `tests/talent/talent-functionality.spec.ts` (or create new test)
- **Test:** "form recovers from Sentry import failure"
- **Steps:**
  1. Mock Sentry import to reject
  2. Navigate to gig application page
  3. Submit form with error
  4. Assert error message displayed
  5. Assert form submitting state is false
  6. Assert form can be resubmitted

#### Issue #3: Talent Dashboard Data Loading
- **File:** `tests/talent/talent-functionality.spec.ts`
- **Test:** "dashboard loads data when supabase initializes"
- **Steps:**
  1. Mock useSupabase to return null initially, then non-null
  2. Navigate to talent dashboard
  3. Assert loading spinner appears
  4. Assert data loads when supabase becomes non-null
  5. Assert no infinite loading spinner

### RED ZONE Regression Checks
- ✅ No middleware changes - no redirect loop tests needed
- ✅ No auth/callback changes - no bootstrap tests needed
- ✅ No Stripe changes - no webhook tests needed
- ✅ No RLS changes - no permission tests needed

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

### Summary of Recommendations:
- **Issue #1:** Approach A (Add error display component)
- **Issue #2:** Approach A (Wrap Sentry import in try-catch)
- **Issue #3:** Approach A (Include `supabase` in dependencies)

All three fixes are minimal, UI/error-handling only changes that respect the Constitution and Airport boundaries.
