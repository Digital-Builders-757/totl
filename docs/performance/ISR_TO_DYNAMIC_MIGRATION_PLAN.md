# ISR to Dynamic Migration Plan — MVP Honesty Mode

**Date:** January 20, 2026  
**Status:** DESIGN ONLY  
**Purpose:** Remove ISR from routes that use `createSupabaseServer()` / `cookies()` to prevent caching confusion and ensure honest dynamic behavior

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiable architectural boundaries
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation spine
- ✅ `docs/ROUTE_CACHING_STRATEGY.md` - Current caching documentation (needs update)
- ✅ `docs/diagrams/airport-model.md` - Airport architecture zones
- ✅ `app/gigs/[id]/page.tsx` - Currently uses ISR (`revalidate = 300`) but calls `createSupabaseServer()`
- ✅ `app/talent/[slug]/page.tsx` - Currently uses ISR (`revalidate = 600`) and calls `createSupabaseServer()`
- ✅ `lib/supabase/supabase-server.ts` - Uses `cookies()` which requires dynamic rendering

### Canonical Mental Model
- ✅ `docs/diagrams/airport-model.md` - Airport architecture zones

### Selected Diagrams (and WHY)
- **Airport Model** (`docs/diagrams/airport-model.md`): This change touches **Terminal** (UI pages) and **Security** (session/cookie handling). Routes that read cookies cannot be statically generated.

### Current State Analysis

**Problem Statement:**
- `/gigs/[id]` has `export const revalidate = 300` (ISR) but calls `createSupabaseServer()` which uses `cookies()`
- `/talent/[slug]` has `export const revalidate = 600` (ISR) but calls `createSupabaseServer()` which uses `cookies()`
- **ISR cannot work correctly** when routes access request-bound values (cookies, headers, searchParams)
- Next.js will still render these pages, but they're effectively dynamic (not truly cached)
- Documentation claims these routes use ISR/CDN caching, which is misleading

**Root Cause:**
- `createSupabaseServer()` calls `cookies()` from `next/headers`, which requires dynamic rendering
- Any route that calls `createSupabaseServer()` cannot be statically generated
- ISR (`revalidate`) is incompatible with request-bound APIs (`cookies()`, `headers()`, `searchParams`)

**Impact:**
- No functional bug (pages still work)
- Performance confusion (expected CDN caching but not happening)
- Documentation lies to future developers

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 1. **Middleware = security only**
- **Rule:** Allow/deny/redirect only. No business logic. No DB writes.
- **Impact:** This change does NOT touch middleware. Routes are being updated to be honest about their rendering mode.

### 2. **All mutations are server-side**
- **Rule:** Server Actions or API Routes only for mutations.
- **Impact:** No impact. This change only affects page rendering strategy, not mutation patterns.

### 3. **No DB calls in client components**
- **Rule:** No writes and no privileged reads.
- **Impact:** No impact. Routes continue to use Server Components with `createSupabaseServer()`.

### 4. **RLS is final authority**
- **Rule:** Never bypass RLS with service role in client/browser code.
- **Impact:** No impact. RLS enforcement remains unchanged. Routes still query through RLS-protected Supabase client.

### 5. **Prefer minimal diffs**
- **Rule:** Especially in red flag files (middleware, auth-provider, signout route).
- **Impact:** This change is **minimal and safe**:
  - Remove `export const revalidate` (1 line)
  - Add `export const dynamic = "force-dynamic"` (1 line)
  - Update comments (2-3 lines)
  - Update documentation (1 sentence)
  - No logic changes, no auth changes, no routing changes

### RED ZONE INVOLVED: **NO**

**Why not:**
- No middleware changes
- No auth/callback changes
- No profile bootstrap changes
- No Stripe/webhook changes
- No RLS/policy changes
- Only page rendering configuration changes

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Terminal Zone (UI Pages)
**What it does:**
- `/gigs/[id]` - Public gig detail page (shows gig info, application status)
- `/talent/[slug]` - Public talent profile page (shows talent info, sensitive fields gated)

**Current behavior:**
- Both routes call `createSupabaseServer()` to check session and fetch user-specific data
- Both routes claim ISR but are effectively dynamic due to cookie access

**Change:**
- Remove ISR configuration (`revalidate`)
- Add explicit `dynamic = "force-dynamic"` to be honest about rendering mode
- Update comments to remove misleading ISR claims

**What stays OUT:**
- No changes to data fetching logic
- No changes to RLS policies
- No changes to component structure
- No changes to authentication checks

### Security Zone (middleware.ts)
**What it does:**
- Not touched by this change

### Staff Zone (Server Actions / API Routes)
**What it does:**
- Not touched by this change

### Locks Zone (RLS / DB constraints)
**What it does:**
- Not touched by this change

### Other Zones
- **Ticketing** (Stripe): Not touched
- **Announcements** (Email): Not touched
- **Baggage** (Storage): Not touched
- **Control Tower** (Admin): Not touched

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: Simple + Safe MVP Mode (RECOMMENDED)

**Description:**
Remove ISR from routes that use `createSupabaseServer()`, add explicit `force-dynamic`, update comments and docs.

**Files to change:**

1. **`app/gigs/[id]/page.tsx`**
   - **Delete:** `export const revalidate = 300;` (line 20)
   - **Delete:** Comment about "use ISR for CDN caching" (lines 17-19)
   - **Add:** `export const dynamic = "force-dynamic";`
   - **Update:** Comment to clarify dynamic rendering

2. **`app/talent/[slug]/page.tsx`**
   - **Delete:** `export const revalidate = 600;` (line 70)
   - **Delete:** Comment about "use ISR for CDN caching" (lines 68-69)
   - **Add:** `export const dynamic = "force-dynamic";` (optional but recommended for clarity)

3. **`docs/ROUTE_CACHING_STRATEGY.md`**
   - **Update:** Public Routes section to remove `/gigs/[id]` and `/talent/[slug]` from ISR table
   - **Add:** New section: "Routes Using `createSupabaseServer()` (Always Dynamic)"
   - **Add:** Explicit rule: "Any route using `createSupabaseServer()` (cookies/session) is treated as dynamic; ISR is not applied."

**Data model impact:** None

**Key risks:**
- ✅ **No redirect loops** - No routing changes
- ✅ **No profile bootstrap gaps** - No auth changes
- ✅ **RLS enforcement unchanged** - No policy changes
- ✅ **No Stripe/webhook impact** - Not touched
- ⚠️ **Performance expectation** - Pages will be slower (no CDN caching), but this is honest and expected

**Why this respects Constitution:**
- Minimal diff (3 files, ~10 lines changed)
- No red zone violations
- Honest about rendering behavior
- No security implications

**Why this respects Airport boundaries:**
- Only touches Terminal (UI pages)
- No cross-zone violations
- Clear separation of concerns

---

### Approach B: Hybrid Split (NOT RECOMMENDED FOR MVP)

**Description:**
Refactor routes to split public data (ISR) from user-specific data (dynamic client component).

**Files to change:**
- Split `/gigs/[id]` into Server Component (ISR) + Client Component (dynamic)
- Split `/talent/[slug]` similarly
- More complex, requires refactoring

**Data model impact:** None

**Key risks:**
- ❌ **Complex refactoring** - Requires splitting components
- ❌ **Waterfall loading** - Public data loads first, then user data
- ❌ **More code to maintain** - Two rendering strategies per route
- ❌ **Potential bugs** - More moving parts

**Why NOT recommended:**
- Violates "minimal diff" principle
- Adds complexity without clear benefit for MVP
- Can be done later if performance becomes critical

---

### Approach C: Remove `createSupabaseServer()` from Public Routes (NOT RECOMMENDED)

**Description:**
Refactor routes to not use `createSupabaseServer()` for public data, only use it in client components for user-specific checks.

**Files to change:**
- Refactor `/gigs/[id]` to fetch public data without cookies
- Move user-specific checks to client components
- More complex, requires architectural changes

**Data model impact:** None

**Key risks:**
- ❌ **Architectural violation** - Breaks Server Component pattern
- ❌ **Security concerns** - User checks moved to client (less secure)
- ❌ **Complex refactoring** - Requires significant changes
- ❌ **RLS complexity** - Need to handle anonymous vs authenticated queries differently

**Why NOT recommended:**
- Violates architecture principles
- Security implications
- Too complex for MVP

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- ✅ `/gigs/[id]` page loads correctly for both signed-in and signed-out users
- ✅ `/talent/[slug]` page loads correctly for both signed-in and signed-out users
- ✅ User-specific data (application status, sensitive fields) displays correctly
- ✅ No visual regressions or layout shifts

### Data Correctness
- ✅ Gig details display correctly (title, description, client info)
- ✅ Talent profile displays correctly (public fields)
- ✅ User-specific checks work (hasApplied, canViewSensitive)
- ✅ Subscription gating works correctly

### Permissions & Access Control
- ✅ RLS policies continue to enforce correctly
- ✅ Client details visibility gating works
- ✅ Application status checks work
- ✅ Sensitive field access (phone) gating works

### Failure Cases (What Must NOT Happen)
- ❌ Pages should NOT show stale data (they're dynamic now, so this is expected)
- ❌ Pages should NOT fail to load due to cookie errors
- ❌ User-specific data should NOT be missing
- ❌ No redirect loops or auth errors

### Performance Expectations
- ⚠️ Pages will be slower (no CDN caching) - this is expected and honest
- ⚠️ Each request will hit the server - this is correct for dynamic routes
- ⚠️ Future optimization can add ISR back if routes are refactored to not use cookies

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path - Signed-Out User
1. **`/gigs/[id]`**
   - Navigate to `/gigs/[id]` while signed out
   - Verify gig details display correctly
   - Verify "Sign in to apply" button appears
   - Verify client details are hidden (shows sign-in prompt)
   - Verify page loads without errors

2. **`/talent/[slug]`**
   - Navigate to `/talent/[slug]` while signed out
   - Verify talent profile displays correctly
   - Verify public fields are visible
   - Verify sensitive fields (phone) are hidden
   - Verify page loads without errors

#### Happy Path - Signed-In Talent User
1. **`/gigs/[id]`**
   - Sign in as talent user
   - Navigate to `/gigs/[id]` for gig they haven't applied to
   - Verify "Apply Now" button appears (if subscribed)
   - Verify subscription prompt appears (if not subscribed)
   - Verify application status is checked correctly
   - Verify client details visibility based on subscription

2. **`/talent/[slug]`**
   - Sign in as talent user
   - Navigate to own profile (`/talent/[slug]`)
   - Verify sensitive fields (phone) are visible
   - Navigate to another talent's profile
   - Verify sensitive fields are hidden (unless relationship exists)

#### Happy Path - Signed-In Client User
1. **`/gigs/[id]`**
   - Sign in as client user
   - Navigate to `/gigs/[id]` for their own gig
   - Verify client details are visible
   - Verify "Apply" section shows appropriate message

2. **`/talent/[slug]`**
   - Sign in as client user
   - Navigate to `/talent/[slug]` for talent they have relationship with
   - Verify sensitive fields (phone) are visible
   - Navigate to talent they don't have relationship with
   - Verify sensitive fields are hidden

#### Edge Cases
1. **Invalid gig ID**
   - Navigate to `/gigs/invalid-id`
   - Verify 404 page displays

2. **Invalid talent slug**
   - Navigate to `/talent/invalid-slug`
   - Verify 404 page displays

3. **Gig with no image**
   - Navigate to gig without `image_url`
   - Verify page loads without image errors

4. **Talent with missing fields**
   - Navigate to talent profile with null/empty fields
   - Verify page handles missing data gracefully

### Automated Tests to Add/Update

**No new automated tests required** - this is a configuration change, not a logic change. Existing tests should continue to pass.

**Regression checks:**
- ✅ Existing E2E tests for `/gigs/[id]` should pass
- ✅ Existing E2E tests for `/talent/[slug]` should pass
- ✅ No new test failures

### RED ZONE Regression Checks

**Not applicable** - No red zone changes.

**Verification:**
- ✅ Middleware behavior unchanged (no cookie/auth changes)
- ✅ Auth flow unchanged (no callback/profile changes)
- ✅ RLS policies unchanged (no policy changes)

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

**Recommendation:** **Approach A** - Simple + Safe MVP Mode

This approach:
- ✅ Minimal diff (3 files, ~10 lines)
- ✅ No red zone violations
- ✅ Honest about rendering behavior
- ✅ Safe and reversible
- ✅ Can be done in < 5 minutes

Approaches B and C are too complex for MVP and can be done later if performance becomes critical.
