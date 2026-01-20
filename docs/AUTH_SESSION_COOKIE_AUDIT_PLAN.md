# Auth Session & Cookie Audit Plan

**Date:** January 19, 2026  
**Status:** DESIGN ONLY  
**Purpose:** Complete production readiness audit for session/cookies/sign-in/out UX issues

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiable architectural boundaries
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation spine
- ✅ `middleware.ts` - Security/routing gate
- ✅ `components/auth/auth-provider.tsx` - Auth state owner
- ✅ `lib/supabase/supabase-browser.ts` - Browser client initialization
- ✅ `lib/supabase/supabase-server.ts` - Server client cookie handling
- ✅ `app/api/auth/signout/route.ts` - Sign-out API route
- ✅ `app/login/page.tsx` - Login page
- ✅ `app/client/dashboard/page.tsx` - Client dashboard (UI trouble spot)
- ✅ `app/talent/dashboard/client.tsx` - Talent dashboard (UI trouble spot)

### Canonical Mental Model
- ✅ `docs/diagrams/airport-model.md` - Airport architecture zones

### Selected Diagrams (and WHY)
- **Airport Model** (`docs/diagrams/airport-model.md`): Auth issues span **Security** (middleware), **Terminal** (UI), and **Ticketing** (Supabase Auth) zones. Cookie handling crosses SSR/CSR boundaries.
- **Signup Bootstrap Flow** (`docs/diagrams/signup-bootstrap-flow.md`): Relevant for understanding profile bootstrap race conditions that can cause stale UI.

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 1. **Middleware = security only**
- **Rule:** Allow/deny/redirect only. No business logic. No DB writes.
- **Impact:** Middleware reads cookies via `createServerClient` but does not mutate them. Cookie clearing must happen in API routes or Server Actions.

### 2. **Browser client initialization**
- **Rule:** `createSupabaseBrowser()` must be initialized in `useEffect`, `useLayoutEffect`, or event handlers, never during render.
- **Impact:** AuthProvider correctly initializes in `useEffect`, but we must verify no stale client instances persist after sign-out.

### 3. **All mutations are server-side**
- **Rule:** Server Actions or API Routes only for mutations.
- **Impact:** Sign-out flow correctly uses `/api/auth/signout` route. Must verify cookie clearing happens server-side before client-side `signOut()` completes.

### 4. **RLS is final authority**
- **Rule:** Never bypass RLS with service role in client/browser code.
- **Impact:** No RLS changes needed. Audit focuses on session/cookie state, not data access.

### 5. **Prefer minimal diffs**
- **Rule:** Especially in red flag files (middleware, auth-provider, signout route).
- **Impact:** Fixes must be surgical. No architectural refactoring unless proven necessary.

### RED ZONE INVOLVED: **YES**

**Red zones touched:**
- **middleware** - Reads cookies, makes routing decisions based on session
- **auth/callback** - Not directly, but sign-in flow touches callback
- **profile bootstrap** - `ensureProfileExists()` race conditions can cause stale UI
- **RLS / triggers / policies** - Not directly, but session state affects RLS queries

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Security Zone (middleware.ts)
**What it does:**
- Reads cookies via `createServerClient` to check `supabase.auth.getUser()`
- Makes routing decisions (allow/deny/redirect) based on session + profile
- Honors `signedOut=true` query param to prevent redirect loops during cookie clearing

**What must stay OUT:**
- Cookie mutation (cookies are read-only in middleware)
- Profile creation/mutation
- Business logic beyond routing

**Audit focus:**
- Cookie read timing vs. cookie clear timing (race condition window)
- `signedOut=true` handling prevents loops but may allow stale session reads

### Terminal Zone (UI pages & components)
**What it does:**
- Displays user/profile data from `useAuth()` hook
- Shows loading states during auth transitions
- Handles sign-out button clicks

**What must stay OUT:**
- Direct Supabase client creation during render
- DB mutations (must use Server Actions/API routes)
- Cookie manipulation (handled by API routes)

**Audit focus:**
- Stale UI after sign-out (profile/user state not resetting)
- Loading states stuck during auth transitions
- Multiple sign-out handlers competing (navbar, dashboard, settings)

### Ticketing Zone (Supabase Auth)
**What it does:**
- Manages session tokens (stored in cookies + localStorage)
- Emits `onAuthStateChange` events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- Handles `signIn()` and `signOut()` calls

**What must stay OUT:**
- App-level profile/role logic (that's in `public.profiles`)
- Cookie domain/path configuration (handled by `@supabase/ssr`)

**Audit focus:**
- Cookie persistence after `signOut()` (multiple cookie chunks, domain/path mismatches)
- `onAuthStateChange` event timing vs. cookie clear timing
- localStorage persistence (browser client uses `persistSession: true`)

### Staff Zone (Server Actions / API Routes)
**What it does:**
- `/api/auth/signout` clears HTTP-only cookies server-side
- `ensureProfileExists()` creates/repairs profiles
- `getBootState()` determines post-auth redirects

**What must stay OUT:**
- Client-side cookie reads (must use server client)
- Direct RLS bypass (must respect RLS)

**Audit focus:**
- Cookie clearing completeness (all chunks, all patterns)
- Sign-out API route error handling (failures swallowed silently)
- Race conditions: API route clears cookies → client `signOut()` → navigation

### Locks Zone (RLS / DB constraints)
**Not directly involved** - Session state affects RLS queries, but RLS itself is not the problem.

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: Fix Cookie Clearing Race Condition (HIGHEST ROI)

**High-level description:**
Ensure server-side cookie clearing completes before client-side `signOut()` and navigation. Add explicit `router.refresh()` after sign-out to invalidate RSC cache.

**Files expected to change:**
- `components/auth/auth-provider.tsx` (signOut method)
- `app/api/auth/signout/route.ts` (error handling)

**Data model impact:** None

**Key risks:**
- **Redirect loops:** Already mitigated by `signedOut=true` query param
- **Profile bootstrap gaps:** Not affected (sign-out doesn't create profiles)
- **RLS enforcement:** Not affected
- **Stale RSC cache:** Addressed by `router.refresh()` after sign-out

**Why this respects Constitution:**
- Minimal diff (only sign-out flow)
- No DB mutations
- No middleware changes
- Keeps Terminal zone boundaries (UI calls API, API clears cookies)

**Why this respects Airport boundaries:**
- Security zone unchanged (middleware still reads cookies)
- Terminal zone calls Staff zone (API route)
- Staff zone clears cookies (its responsibility)
- Ticketing zone (Supabase) still emits events

---

### Approach B: Fix Stale UI State After Sign-Out

**High-level description:**
Ensure AuthProvider resets all state synchronously before navigation. Remove competing sign-out handlers in dashboard components.

**Files expected to change:**
- `components/auth/auth-provider.tsx` (SIGNED_OUT handler)
- `app/talent/dashboard/client.tsx` (remove fallback sign-out timeout)
- `app/settings/sections/account-settings.tsx` (remove fallback sign-out timeout)
- `app/dashboard/client.tsx` (remove duplicate redirect)

**Data model impact:** None

**Key risks:**
- **Redirect loops:** Low risk (AuthProvider is single redirect owner)
- **Profile bootstrap gaps:** Not affected
- **RLS enforcement:** Not affected
- **Multiple redirects:** Fixed by removing competing handlers

**Why this respects Constitution:**
- Minimal diff (remove redundant code)
- No DB mutations
- No middleware changes
- Keeps Terminal zone boundaries (UI consumes auth state, doesn't own it)

**Why this respects Airport boundaries:**
- Terminal zone simplified (removes competing logic)
- AuthProvider remains single source of truth
- No Security zone changes

---

### Approach C: Fix Loading State Stuck During Auth Transitions

**High-level description:**
Ensure `isLoading` resets correctly after auth state changes. Fix `useEffect` dependencies that cause one-time early returns.

**Files expected to change:**
- `components/auth/auth-provider.tsx` (onAuthStateChange handler)
- `app/client/dashboard/page.tsx` (loading gate logic)
- `app/talent/dashboard/client.tsx` (loading gate logic)

**Data model impact:** None

**Key risks:**
- **Redirect loops:** Low risk
- **Profile bootstrap gaps:** Low risk (loading gates already exist)
- **RLS enforcement:** Not affected
- **Stale loading state:** Fixed by ensuring `isLoading` resets

**Why this respects Constitution:**
- Minimal diff (loading state logic only)
- No DB mutations
- No middleware changes
- Keeps Terminal zone boundaries

**Why this respects Airport boundaries:**
- Terminal zone only (UI loading states)
- No Security/Ticketing/Staff zone changes

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- ✅ Sign-out button click → loading state shows → redirects to `/login?signedOut=true` within 1 second
- ✅ After sign-out, UI shows no user/profile data (no stale state)
- ✅ Sign-in → loading state shows → redirects to dashboard within 2 seconds
- ✅ Loading states never stuck indefinitely (max 8 seconds, then timeout recovery)

### Data Correctness
- ✅ After sign-out, cookies are cleared (verified in Chrome DevTools → Application → Cookies)
- ✅ After sign-out, localStorage has no Supabase auth tokens (verified in DevTools → Application → Storage)
- ✅ After sign-in, cookies are set correctly (verified in DevTools)
- ✅ Profile data matches session (no stale profile after sign-out/sign-in)

### Permissions & Access Control
- ✅ After sign-out, middleware correctly denies access to protected routes
- ✅ After sign-in, middleware correctly allows access based on role
- ✅ No redirect loops (user never stuck bouncing between routes)

### Failure Cases (What Must NOT Happen)
- ❌ Sign-out leaves cookies behind (causing "still logged in" after refresh)
- ❌ Sign-out leaves stale UI state (showing previous user's data)
- ❌ Sign-in gets stuck on loading spinner (never redirects)
- ❌ Sign-out triggers redirect loop (bouncing between routes)
- ❌ Multiple sign-out handlers compete (causing duplicate redirects)

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path: Sign-Out
1. Log in as talent user
2. Navigate to `/talent/dashboard`
3. Open Chrome DevTools → Application → Cookies
4. Note cookie names: `sb-{projectRef}-auth-token`, `sb-{projectRef}-auth-token.0`, etc.
5. Click "Sign Out" button
6. **Verify:** Cookies are cleared within 1 second (watch Network tab for `/api/auth/signout` POST)
7. **Verify:** Redirects to `/login?signedOut=true` within 1 second
8. **Verify:** UI shows no user/profile data (check navbar, dashboard)
9. **Verify:** localStorage has no Supabase tokens (DevTools → Application → Storage → Local Storage)

#### Happy Path: Sign-In
1. Start on `/login` page (signed out)
2. Enter credentials and submit
3. **Verify:** Loading spinner shows immediately
4. **Verify:** Redirects to dashboard within 2 seconds
5. **Verify:** Cookies are set (DevTools → Application → Cookies)
6. **Verify:** UI shows correct user/profile data

#### Edge Case: Sign-Out During Navigation
1. Log in as talent user
2. Navigate to `/talent/dashboard`
3. Click "Sign Out" button
4. Immediately click browser back button (before redirect completes)
5. **Verify:** Still redirects to `/login?signedOut=true` (no stuck state)

#### Edge Case: Sign-Out with Network Failure
1. Log in as talent user
2. Open DevTools → Network → Throttling → Offline
3. Click "Sign Out" button
4. **Verify:** UI still resets (local state cleared)
5. **Verify:** After network restored, cookies are cleared on next request

#### Edge Case: Cross-Tab Sign-Out
1. Log in as talent user in Tab A
2. Open same site in Tab B (same user)
3. Sign out in Tab A
4. **Verify:** Tab B detects sign-out via `onAuthStateChange` and redirects to login

### Automated Tests to Add

#### Test: Sign-Out Clears Cookies
```typescript
test("Sign-out clears all Supabase cookies", async ({ page, context }) => {
  // Log in
  await loginAsTalent(page);
  
  // Get cookies before sign-out
  const cookiesBefore = await context.cookies();
  const supabaseCookies = cookiesBefore.filter(c => c.name.startsWith('sb-'));
  expect(supabaseCookies.length).toBeGreaterThan(0);
  
  // Sign out
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL('**/login?signedOut=true');
  
  // Get cookies after sign-out
  const cookiesAfter = await context.cookies();
  const supabaseCookiesAfter = cookiesAfter.filter(c => c.name.startsWith('sb-'));
  expect(supabaseCookiesAfter.length).toBe(0);
});
```

#### Test: Sign-Out Resets UI State
```typescript
test("Sign-out resets UI to show no user data", async ({ page }) => {
  await loginAsTalent(page);
  
  // Verify user data is shown
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
  
  // Sign out
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL('**/login?signedOut=true');
  
  // Verify user data is gone
  await expect(page.locator('[data-testid="user-name"]')).not.toBeVisible();
  await expect(page.locator('text=Sign In')).toBeVisible();
});
```

#### Test: Sign-Out Prevents Redirect Loop
```typescript
test("Sign-out does not trigger redirect loop", async ({ page }) => {
  await loginAsTalent(page);
  
  // Sign out
  await page.click('button:has-text("Sign Out")');
  
  // Wait for redirect
  await page.waitForURL('**/login?signedOut=true');
  
  // Verify we stay on login page (no loop)
  await page.waitForTimeout(2000);
  expect(page.url()).toContain('/login?signedOut=true');
});
```

#### Test: Sign-In Redirects Correctly
```typescript
test("Sign-in redirects to dashboard after loading", async ({ page }) => {
  await page.goto('/login');
  
  // Fill form and submit
  await page.fill('[data-testid="email"]', 'talent@test.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Verify loading state
  await expect(page.locator('text=Signing in...')).toBeVisible();
  
  // Verify redirect to dashboard
  await page.waitForURL('**/talent/dashboard', { timeout: 5000 });
  
  // Verify user data is shown
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
});
```

### Sentry Instrumentation Suggestions

#### Breadcrumb Points for Auth Transitions
1. **Sign-out initiated:** `auth.signout.init` (when button clicked)
2. **Server sign-out API called:** `auth.signout.api.start` (before fetch)
3. **Server sign-out API completed:** `auth.signout.api.done` (after fetch, include success/error)
4. **Client sign-out called:** `auth.signout.client.start` (before `supabase.auth.signOut()`)
5. **Client sign-out completed:** `auth.signout.client.done` (after `supabase.auth.signOut()`)
6. **Navigation started:** `auth.signout.navigate` (before `window.location.replace()`)
7. **SIGNED_OUT event received:** `auth.onAuthStateChange.SIGNED_OUT` (in `onAuthStateChange` handler)
8. **Cookie clear verification:** `auth.signout.cookies.verify` (after navigation, check cookie count)

#### Error Tracking
- Track `signOut()` errors (client-side failures)
- Track `/api/auth/signout` failures (server-side failures)
- Track redirect loop detection (same route visited >3 times in 5 seconds)
- Track loading state timeout (isLoading stuck >8 seconds)

---

## A) SYMPTOM MATRIX

| Symptom | Where Observed | Likely Cause Candidates | Files Involved | Severity |
|---------|---------------|---------------------------|----------------|----------|
| Sessions/cookies persist after sign-out | All dashboards, navbar | Cookie clearing race condition; multiple cookie chunks not cleared | `app/api/auth/signout/route.ts`, `components/auth/auth-provider.tsx` | 🔴 HIGH |
| Loading states stuck during sign-out | Talent dashboard, client dashboard | `isLoading` not resetting; navigation before state cleared | `components/auth/auth-provider.tsx`, `app/talent/dashboard/client.tsx` | 🟡 MEDIUM |
| Stale user/profile after logout | Navbar, dashboards | State reset happens after navigation; RSC cache not invalidated | `components/auth/auth-provider.tsx`, `app/client/dashboard/page.tsx` | 🟡 MEDIUM |
| UI shows stale data after login | Dashboards | Profile fetch races session establishment; RSC cache stale | `components/auth/auth-provider.tsx`, `app/talent/dashboard/client.tsx` | 🟡 MEDIUM |
| Sign-out feels delayed | All pages | Multiple sign-out handlers competing; fallback timeouts | `app/talent/dashboard/client.tsx`, `app/settings/sections/account-settings.tsx` | 🟢 LOW |
| Redirect loops during sign-out | Middleware | `signedOut=true` not honored; cookies cleared but middleware still sees session | `middleware.ts`, `components/auth/auth-provider.tsx` | 🔴 HIGH (mitigated) |

---

## B) SESSION STORAGE INVENTORY (WHAT PERSISTS WHERE)

### Cookies (HTTP-only, set by server)
**Names:**
- `sb-{projectRef}-auth-token` (base cookie, may be chunked as `.0`, `.1`, etc., up to `.19`)
- Legacy patterns: `sb-access-token`, `sb-refresh-token`, `sb-user-token` (also chunked)

**Who sets them:**
- `@supabase/ssr` `createServerClient` (in middleware, API routes, Server Actions)
- Cookie store: `next/headers` `cookies()` (server-side only)

**Path/Domain/Security:**
- Path: `/` (root)
- Domain: Not set (defaults to current domain)
- httpOnly: `true` (set by `@supabase/ssr`)
- secure: `true` in production, `false` in development
- sameSite: `lax` (set by `@supabase/ssr`)

**Clearing mechanism:**
- Server-side: `/api/auth/signout` route sets cookies to `""` with `expires: new Date(0)`
- Client-side: `supabase.auth.signOut()` clears cookies via Supabase client

### localStorage (Browser-only, set by client)
**Keys:**
- `sb-{projectRef}-auth-token` (Supabase stores session here for browser client)

**Who sets it:**
- `createSupabaseBrowser()` with `persistSession: true` (default)

**Clearing mechanism:**
- `supabase.auth.signOut()` clears localStorage automatically
- `resetSupabaseBrowserClient()` resets singleton but doesn't clear storage (storage cleared by `signOut()`)

### sessionStorage
**Not used** - Supabase uses localStorage for persistence.

### In-Memory React Context/State (AuthProvider)
**State variables:**
- `user: User | null`
- `session: Session | null`
- `userRole: UserRole`
- `profile: ProfileData`
- `isLoading: boolean`
- `isEmailVerified: boolean`
- `hasHandledInitialSession: boolean`

**Who sets them:**
- `setUser()`, `setSession()`, `setUserRole()`, `setProfile()`, `setIsLoading()`, etc. (in AuthProvider)

**Clearing mechanism:**
- Sign-out resets all to `null`/`false` synchronously
- `onAuthStateChange` handler updates on SIGNED_OUT event

### RSC Cache / Next.js Router Cache
**What it caches:**
- Server Component payloads (including user/profile data fetched server-side)
- Route data (cached by Next.js router)

**Who sets it:**
- Next.js App Router (automatic)

**Clearing mechanism:**
- `router.refresh()` invalidates RSC cache
- `window.location.replace()` forces full page reload (bypasses cache)

**Race condition risk:**
- Sign-out clears cookies → navigation happens → RSC cache still has old user data → UI shows stale state until refresh

### Supabase Client Lifecycle
**Browser client:**
- Created in `useEffect` after mount (`createSupabaseBrowser()`)
- Stored in `supabaseRef.current` (singleton pattern)
- Reset on sign-out via `resetSupabaseBrowserClient()`

**Server client:**
- Created per-request in middleware/API routes (`createSupabaseServer()`)
- Reads cookies via `cookies()` from `next/headers`
- No persistence (recreated each request)

**Transition states:**
- `null` → initialized (after mount)
- initialized → reset (on sign-out)
- reset → initialized (on next mount after sign-out)

---

## C) AUTH STATE MACHINE (SIGN-IN AND SIGN-OUT)

### Sign-In Flow

1. **User action:** Submit login form (`app/login/page.tsx`)
   - Calls `signIn(email, password)` from `useAuth()`

2. **Supabase auth call:** `supabase.auth.signInWithPassword()`
   - Supabase validates credentials
   - Creates session token
   - Sets cookies via `@supabase/ssr` (server-side)
   - Stores session in localStorage (client-side)

3. **Cookie writes:**
   - Server: `createServerClient` sets `sb-{projectRef}-auth-token` cookies (HTTP-only)
   - Client: `createSupabaseBrowser` stores session in localStorage

4. **Auth state event:** `onAuthStateChange` fires `SIGNED_IN`
   - Handler in `auth-provider.tsx` receives event
   - Sets `session` and `user` state
   - Calls `ensureAndHydrateProfile()` to fetch/create profile

5. **UI navigation:**
   - `SIGNED_IN` handler checks if on auth route
   - Calls `getBootState()` to determine redirect target
   - Calls `router.push(bootTarget)`

6. **Server revalidation:**
   - Next.js router navigates to new route
   - Middleware runs, reads cookies, allows access
   - Server Component renders with new session
   - RSC cache stores new payload

**Race conditions:**
- Profile fetch races session establishment → UI may show user but no profile briefly
- Navigation races profile fetch → redirect happens before profile loaded
- RSC cache may have stale data if `router.refresh()` not called

### Sign-Out Flow

1. **User action:** Click "Sign Out" button (navbar, dashboard, settings)
   - Calls `signOut()` from `useAuth()`

2. **State reset (synchronous):**
   - `setUser(null)`
   - `setSession(null)`
   - `setUserRole(null)`
   - `setProfile(null)`
   - `setIsEmailVerified(false)`
   - `setHasHandledInitialSession(false)`
   - `setIsLoading(true)`
   - `resetSupabaseBrowserClient()`

3. **Server-side cookie clear (optional, best effort):**
   - `fetch("/api/auth/signout", { method: "POST" })`
   - API route calls `supabase.auth.signOut()`
   - API route clears all cookie chunks (up to 20)
   - API route sets cookies to `""` with `expires: new Date(0)`

4. **Client-side sign-out:**
   - `supabase.auth.signOut()` clears localStorage
   - Supabase clears cookies via client

5. **Auth state event:** `onAuthStateChange` fires `SIGNED_OUT`
   - Handler receives event
   - Checks `manualSignOutInProgressRef.current` (if true, skip redirect - signOut() owns it)
   - If false (expiry/cross-tab), redirects to `/login?signedOut=true`

6. **UI navigation:**
   - `signOut()` calls `window.location.replace("/login?signedOut=true")`
   - Hard redirect bypasses Next.js router cache

7. **Server revalidation:**
   - Middleware runs, reads cookies (should be empty)
   - `getUser()` returns `null`
   - Allows access to `/login` (auth route)
   - RSC cache invalidated by hard redirect

**Race conditions:**
- Navigation happens before cookies cleared → middleware may still see session → redirect loop risk
- `SIGNED_OUT` event fires before navigation → competing redirects (mitigated by `manualSignOutInProgressRef`)
- RSC cache not invalidated → UI may show stale data until refresh (mitigated by `window.location.replace`)

---

## D) FINDINGS (RANKED)

### Finding 1: Cookie Clearing Race Condition (HIGHEST PRIORITY)
**Title:** Server-side cookie clearing may not complete before client-side navigation

**Evidence:**
- `components/auth/auth-provider.tsx:563-577` - Sign-out calls `/api/auth/signout` but doesn't await completion before `window.location.replace()`
- `app/api/auth/signout/route.ts:5-71` - API route clears cookies but errors are swallowed silently

**Root cause:**
- `fetch("/api/auth/signout")` is wrapped in try/catch that ignores failures
- `window.location.replace()` happens immediately after `supabase.auth.signOut()`, not after API route completes
- If API route fails or is slow, cookies may persist after navigation

**User impact:**
- User signs out → navigates to login → middleware still sees cookies → redirects back to dashboard → "still logged in" feeling

**Fix approach:**
- Await `/api/auth/signout` fetch before calling `supabase.auth.signOut()`
- Add error handling (log to Sentry, but don't block sign-out)
- Add `router.refresh()` after sign-out to invalidate RSC cache (if using soft redirect)

---

### Finding 2: Stale UI State After Sign-Out
**Title:** Profile/user data persists in UI after sign-out due to RSC cache

**Evidence:**
- `components/auth/auth-provider.tsx:553-558` - State reset happens synchronously, but RSC cache may still have old data
- `app/client/dashboard/page.tsx:97` - Dashboard reads `profile` from `useAuth()`, but server-side data may be stale

**Root cause:**
- `window.location.replace()` forces hard redirect, which should clear cache, but timing issues can cause stale data to flash
- No explicit `router.refresh()` after state reset (not needed for hard redirect, but good practice)

**User impact:**
- User signs out → sees previous user's name/avatar briefly → then login page loads

**Fix approach:**
- Ensure state reset happens before navigation (already done)
- Add explicit cache clearing: `router.refresh()` before `window.location.replace()` (defensive)
- Remove competing sign-out handlers in dashboard components (they add fallback timeouts that can cause duplicate redirects)

---

### Finding 3: Multiple Sign-Out Handlers Competing
**Title:** Dashboard components have fallback sign-out handlers that compete with AuthProvider

**Evidence:**
- `app/talent/dashboard/client.tsx:561-600` - Has `handleSignOut()` with fallback timeout
- `app/settings/sections/account-settings.tsx:137-189` - Has `handleSignOut()` with fallback timeout
- `app/dashboard/client.tsx:25-43` - Has `handleSignOut()` with duplicate redirect

**Root cause:**
- Components don't trust AuthProvider's `signOut()` to handle redirect
- Fallback timeouts (100ms) can fire after AuthProvider's redirect, causing duplicate navigation

**User impact:**
- Sign-out feels delayed (waiting for fallback timeout)
- Potential for duplicate redirects (low risk, but confusing)

**Fix approach:**
- Remove fallback handlers from dashboard components
- Trust AuthProvider as single redirect owner
- Keep only loading state management in components

---

### Finding 4: Loading State Not Resetting on Sign-Out Error
**Title:** `isLoading` may stay `true` if sign-out fails

**Evidence:**
- `components/auth/auth-provider.tsx:546-607` - `signOut()` sets `isLoading(true)` but only resets in finally block
- If error occurs after `window.location.replace()`, finally block may not run

**Root cause:**
- `window.location.replace()` causes navigation, which may interrupt error handling
- `isLoading` reset happens in finally block, but navigation may prevent it from running

**User impact:**
- Sign-out fails → loading spinner stuck → user can't retry

**Fix approach:**
- Reset `isLoading` before `window.location.replace()` (defensive)
- Ensure error handler resets state even if navigation happens

---

### Finding 5: Cookie Chunk Clearing May Be Incomplete
**Title:** API route clears up to 20 chunks, but Supabase may use more

**Evidence:**
- `app/api/auth/signout/route.ts:24-36` - Loops through 20 cookie chunks
- Supabase doesn't document max chunk count

**Root cause:**
- Hard-coded limit of 20 chunks may not cover all cases
- No verification that all cookies are actually cleared

**User impact:**
- Rare edge case: if Supabase uses >20 chunks, some cookies persist

**Fix approach:**
- Increase limit to 50 (defensive, low cost)
- Add logging to track actual cookie count cleared
- Verify cookie clearing in tests

---

### Finding 6: SIGNED_OUT Handler May Redirect When Manual Sign-Out Owns It
**Title:** `SIGNED_OUT` event handler checks `manualSignOutInProgressRef`, but race condition possible

**Evidence:**
- `components/auth/auth-provider.tsx:446-494` - `SIGNED_OUT` handler checks ref, but timing window exists
- `signOut()` sets ref to `true`, but `SIGNED_OUT` event may fire before ref is checked

**Root cause:**
- Async timing: `signOut()` sets ref → calls `supabase.auth.signOut()` → `SIGNED_OUT` event fires → handler checks ref
- If event fires synchronously, ref check may happen before ref is set

**User impact:**
- Low risk (ref is set before `signOut()` call), but potential for duplicate redirects

**Fix approach:**
- Set ref before any async operations (already done)
- Add defensive check: if on `/login?signedOut=true`, skip redirect

---

### Finding 7: Profile Fetch Duplication on Sign-In
**Title:** `ensureAndHydrateProfile()` may be called multiple times during sign-in

**Evidence:**
- `components/auth/auth-provider.tsx:351` - Called in initial session check
- `components/auth/auth-provider.tsx:416` - Called again in `SIGNED_IN` handler
- Race condition: initial session check and `SIGNED_IN` event can both fire

**Root cause:**
- Initial session check runs on mount
- `SIGNED_IN` event fires when `signIn()` completes
- Both can happen simultaneously, causing duplicate profile fetches

**User impact:**
- Sign-in feels slow (2 profile fetches instead of 1)
- Unnecessary database load

**Fix approach:**
- Gate `SIGNED_IN` handler: if `hasHandledInitialSession` is true, skip profile fetch (initial check already did it)
- Or: skip initial session check if `SIGNED_IN` event fires first (harder to implement)

---

### Finding 8: Missing router.refresh() After Sign-Out
**Title:** Hard redirect clears cache, but soft redirects (if used) don't invalidate RSC cache

**Evidence:**
- `components/auth/auth-provider.tsx:577` - Uses `window.location.replace()` (hard redirect)
- `components/auth/auth-provider.tsx:580-582` - Fallback uses `router.replace()` + `router.refresh()` (soft redirect)

**Root cause:**
- Hard redirect is correct (clears cache), but fallback path may not work correctly
- No `router.refresh()` before hard redirect (not needed, but defensive)

**User impact:**
- Low risk (hard redirect is primary path), but fallback may show stale data

**Fix approach:**
- Add `router.refresh()` before `window.location.replace()` (defensive, no harm)
- Ensure fallback path also works correctly

---

## E) FIX PLAN (MINIMAL DIFFS)

### File 1: `components/auth/auth-provider.tsx`

**Change 1: Fix cookie clearing race condition**
```typescript
// BEFORE (line 561-577):
try {
  await fetch("/api/auth/signout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
} catch (apiError) {
  console.warn("Server-side sign out API call failed:", apiError);
}

const { error: clientError } = await supabase.auth.signOut();

// AFTER:
// Await server-side cookie clearing before client-side sign-out
let serverSignOutError: Error | null = null;
try {
  const response = await fetch("/api/auth/signout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    serverSignOutError = new Error(`Server sign-out failed: ${response.status}`);
  }
} catch (apiError) {
  serverSignOutError = apiError instanceof Error ? apiError : new Error(String(apiError));
  console.warn("Server-side sign out API call failed:", apiError);
  // Log to Sentry but don't block sign-out
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(serverSignOutError, {
    tags: { feature: "auth", error_type: "signout_api_failure" },
  });
}

const { error: clientError } = await supabase.auth.signOut();
```

**Change 2: Add router.refresh() before navigation (defensive)**
```typescript
// BEFORE (line 574-582):
const to = `${PATHS.LOGIN}?signedOut=true`;
if (typeof window !== "undefined") {
  setIsLoading(false);
  window.location.replace(to);
} else {
  setIsLoading(false);
  router.replace(to);
  router.refresh();
}

// AFTER:
const to = `${PATHS.LOGIN}?signedOut=true`;
if (typeof window !== "undefined") {
  setIsLoading(false);
  // Defensive: refresh router cache before hard redirect (no harm, ensures clean state)
  router.refresh();
  window.location.replace(to);
} else {
  setIsLoading(false);
  router.replace(to);
  router.refresh();
}
```

**Change 3: Reset isLoading before navigation (defensive)**
```typescript
// BEFORE (line 574):
const to = `${PATHS.LOGIN}?signedOut=true`;
if (typeof window !== "undefined") {
  setIsLoading(false);
  window.location.replace(to);
}

// AFTER:
// Reset loading state before navigation to prevent stuck spinner
setIsLoading(false);
const to = `${PATHS.LOGIN}?signedOut=true`;
if (typeof window !== "undefined") {
  router.refresh(); // Defensive cache clear
  window.location.replace(to);
}
```

**Change 4: Gate SIGNED_IN handler to avoid duplicate profile fetches**
```typescript
// BEFORE (line 414-418):
if (event === "SIGNED_IN" && session) {
  try {
    const hydratedProfile = await ensureAndHydrateProfile(session.user);
    if (!mounted) return;
    applyProfileToState(hydratedProfile, session);

// AFTER:
if (event === "SIGNED_IN" && session) {
  try {
    // Skip profile fetch if initial session check already handled it
    // (prevents duplicate fetches when SIGNED_IN races initial session check)
    if (!hasHandledInitialSession) {
      const hydratedProfile = await ensureAndHydrateProfile(session.user);
      if (!mounted) return;
      applyProfileToState(hydratedProfile, session);
    } else {
      // Initial session check already fetched profile, just update state
      const { profile: existingProfile } = await fetchProfile(session.user.id);
      if (!mounted) return;
      applyProfileToState(existingProfile, session);
    }
```

**DO NOT:**
- Remove `window.location.replace()` (hard redirect is correct)
- Change `manualSignOutInProgressRef` logic (it prevents duplicate redirects)
- Remove `resetSupabaseBrowserClient()` call (needed for clean state)

---

### File 2: `app/api/auth/signout/route.ts`

**Change 1: Increase cookie chunk limit (defensive)**
```typescript
// BEFORE (line 24):
for (let i = 0; i < 20; i++) {

// AFTER:
// Increased limit to 50 to cover edge cases (Supabase doesn't document max chunks)
for (let i = 0; i < 50; i++) {
```

**Change 2: Add error handling and logging**
```typescript
// BEFORE (line 5-9):
export async function POST() {
  const supabase = await createSupabaseServer();
  
  // Sign out from Supabase (clears server-side session)
  await supabase.auth.signOut();

// AFTER:
export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    
    // Sign out from Supabase (clears server-side session)
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Supabase sign-out error:", signOutError);
      // Log to Sentry but don't fail the request (cookies still need to be cleared)
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(signOutError, {
        tags: { feature: "auth", error_type: "supabase_signout_error" },
      });
    }
  } catch (error) {
    console.error("Error creating Supabase server client:", error);
    // Continue to clear cookies even if Supabase client creation fails
  }
```

**DO NOT:**
- Change cookie clearing logic (it's correct, just increase limit)
- Remove cookie clearing (it's essential)

---

### File 3: `app/talent/dashboard/client.tsx`

**Change 1: Remove fallback sign-out handler**
```typescript
// BEFORE (line 561-600):
const handleSignOut = async () => {
  if (isSigningOut) return;

  if (signOutTimeoutRef.current) {
    clearTimeout(signOutTimeoutRef.current);
    signOutTimeoutRef.current = null;
  }

  try {
    setIsSigningOut(true);
    await signOut();
    signOutTimeoutRef.current = setTimeout(() => {
      signOutTimeoutRef.current = null;
      const currentPath = window.location.pathname;
      const isAuthRoute = currentPath === "/login" ||
        currentPath === "/choose-role" ||
        currentPath.startsWith("/reset-password") ||
        currentPath.startsWith("/update-password") ||
        currentPath === "/verification-pending";

      if (!isAuthRoute) {
        window.location.replace("/login?signedOut=true");
      } else {
        setIsSigningOut(false);
      }
    }, 100);
  } catch (error) {
    // ... error handling
  }
};

// AFTER:
const handleSignOut = async () => {
  if (isSigningOut) return;
  
  try {
    setIsSigningOut(true);
    // AuthProvider's signOut() owns redirect - trust it
    await signOut();
  } catch (error) {
    console.error("Sign out error:", error);
    toast({
      title: "Sign out error",
      description: "There was an issue signing out. Please try again.",
      variant: "destructive",
    });
    setIsSigningOut(false);
  }
};
```

**Change 2: Remove signOutTimeoutRef (no longer needed)**
```typescript
// BEFORE (line 425):
const signOutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// AFTER:
// Removed - AuthProvider owns sign-out redirect, no fallback needed
```

**Change 3: Remove cleanup in useEffect**
```typescript
// BEFORE (line 550-559):
useEffect(() => {
  return () => {
    if (signOutTimeoutRef.current) {
      clearTimeout(signOutTimeoutRef.current);
    }
    // ... other cleanup
  };
}, []);

// AFTER:
useEffect(() => {
  return () => {
    // Removed signOutTimeoutRef cleanup - no longer needed
    if (urlCleanupTimeoutRef.current) {
      clearTimeout(urlCleanupTimeoutRef.current);
    }
  };
}, []);
```

**DO NOT:**
- Keep fallback timeout (it competes with AuthProvider)
- Add duplicate redirect logic (AuthProvider owns it)

---

### File 4: `app/settings/sections/account-settings.tsx`

**Change: Remove fallback sign-out handler (same as File 3)**
```typescript
// BEFORE (line 137-189):
// Same pattern as talent dashboard - remove fallback timeout

// AFTER:
const handleSignOut = async () => {
  if (isSigningOut) return;
  
  try {
    setIsSigningOut(true);
    await signOut();
  } catch (error) {
    console.error("Sign out error:", error);
    setIsSigningOut(false);
  }
};
```

**DO NOT:**
- Keep fallback timeout

---

### File 5: `app/dashboard/client.tsx`

**Change: Remove duplicate redirect**
```typescript
// BEFORE (line 25-43):
const handleSignOut = async () => {
  if (isLoading) return;
  
  setIsLoading(true);
  setError(null);

  try {
    await signOut();
    
    // Force immediate hard refresh to ensure clean state
    window.location.href = PATHS.LOGIN;
  } catch (err) {
    // ... error handling
  }
};

// AFTER:
const handleSignOut = async () => {
  if (isLoading) return;
  
  setIsLoading(true);
  setError(null);

  try {
    // AuthProvider's signOut() owns redirect - trust it
    await signOut();
  } catch (err) {
    console.error("Error signing out:", err);
    setError("Failed to sign out. Please try again.");
    setIsLoading(false);
  }
};
```

**DO NOT:**
- Add duplicate redirect (AuthProvider owns it)

---

## F) VERIFICATION PLAN

### Manual Repro Steps (Chrome DevTools)

#### Test 1: Sign-Out Cookie Clearing
1. Open Chrome DevTools → Application → Cookies
2. Log in as talent user
3. Note cookie names: `sb-{projectRef}-auth-token`, `sb-{projectRef}-auth-token.0`, etc.
4. Count total Supabase cookies (should be 1-3 typically)
5. Click "Sign Out"
6. **Verify:** All cookies are cleared within 1 second (watch Network tab for `/api/auth/signout` POST → 200 OK)
7. **Verify:** Cookies disappear from Application → Cookies tab
8. **Verify:** Redirects to `/login?signedOut=true`

#### Test 2: Sign-Out UI State Reset
1. Log in as talent user
2. Navigate to `/talent/dashboard`
3. Note user name/avatar in navbar
4. Click "Sign Out"
5. **Verify:** User name/avatar disappear immediately (before redirect)
6. **Verify:** Loading spinner shows briefly (< 1 second)
7. **Verify:** Redirects to login page
8. **Verify:** Login page shows no user data

#### Test 3: Sign-Out Network Failure Handling
1. Log in as talent user
2. Open DevTools → Network → Throttling → Offline
3. Click "Sign Out"
4. **Verify:** UI still resets (local state cleared)
5. **Verify:** Error is logged to console (but doesn't block sign-out)
6. Restore network
7. **Verify:** Cookies are cleared on next request (or manual refresh)

#### Test 4: Sign-In Profile Fetch
1. Start on `/login` page
2. Open DevTools → Network → Filter: "profiles"
3. Submit login form
4. **Verify:** Only ONE profile fetch request (not duplicate)
5. **Verify:** Redirects to dashboard within 2 seconds
6. **Verify:** Profile data loads correctly

### Network Expectations

#### Sign-Out Flow
1. `POST /api/auth/signout` → 200 OK (clears cookies)
2. `supabase.auth.signOut()` → clears localStorage (no network request)
3. `SIGNED_OUT` event fires (no network request)
4. `window.location.replace("/login?signedOut=true")` → navigation (no network request for sign-out, but login page loads)

#### Sign-In Flow
1. `POST /auth/v1/token?grant_type=password` → 200 OK (Supabase auth endpoint)
2. `GET /rest/v1/profiles?id=eq.{userId}` → 200 OK (profile fetch, should happen once)
3. `SIGNED_IN` event fires (no network request)
4. `router.push("/talent/dashboard")` → navigation (dashboard page loads)

### Playwright Tests to Add

#### Test: Sign-Out Clears All Cookies
```typescript
test("Sign-out clears all Supabase cookies", async ({ page, context }) => {
  await loginAsTalent(page);
  
  const cookiesBefore = await context.cookies();
  const supabaseCookiesBefore = cookiesBefore.filter(c => 
    c.name.startsWith('sb-') || c.name.includes('auth-token')
  );
  expect(supabaseCookiesBefore.length).toBeGreaterThan(0);
  
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL('**/login?signedOut=true', { timeout: 5000 });
  
  const cookiesAfter = await context.cookies();
  const supabaseCookiesAfter = cookiesAfter.filter(c => 
    c.name.startsWith('sb-') || c.name.includes('auth-token')
  );
  expect(supabaseCookiesAfter.length).toBe(0);
});
```

#### Test: Sign-Out Resets UI State
```typescript
test("Sign-out resets UI to show no user data", async ({ page }) => {
  await loginAsTalent(page);
  
  await expect(page.locator('[data-testid="user-name"], [data-testid="user-avatar"]')).toBeVisible();
  
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL('**/login?signedOut=true');
  
  await expect(page.locator('[data-testid="user-name"], [data-testid="user-avatar"]')).not.toBeVisible();
  await expect(page.locator('text=Sign In')).toBeVisible();
});
```

#### Test: Sign-Out Prevents Redirect Loop
```typescript
test("Sign-out does not trigger redirect loop", async ({ page }) => {
  await loginAsTalent(page);
  
  await page.click('button:has-text("Sign Out")');
  await page.waitForURL('**/login?signedOut=true', { timeout: 5000 });
  
  // Wait 3 seconds and verify we're still on login page (no loop)
  await page.waitForTimeout(3000);
  expect(page.url()).toContain('/login?signedOut=true');
  
  // Verify middleware allows access (no redirect back to dashboard)
  await expect(page.locator('text=Sign In')).toBeVisible();
});
```

#### Test: Sign-In Redirects Correctly
```typescript
test("Sign-in redirects to dashboard after loading", async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[data-testid="email"]', 'talent@test.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page.locator('text=Signing in...')).toBeVisible({ timeout: 1000 });
  await page.waitForURL('**/talent/dashboard', { timeout: 5000 });
  
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
});
```

#### Test: Sign-Out Network Failure Handling
```typescript
test("Sign-out handles network failure gracefully", async ({ page, context }) => {
  await loginAsTalent(page);
  
  // Block network requests
  await context.route('**/api/auth/signout', route => route.abort());
  
  await page.click('button:has-text("Sign Out")');
  
  // Should still redirect (client-side sign-out works)
  await page.waitForURL('**/login?signedOut=true', { timeout: 5000 });
  
  // Verify UI reset (even if server sign-out failed)
  await expect(page.locator('[data-testid="user-name"]')).not.toBeVisible();
});
```

### Sentry Instrumentation Suggestions

#### Breadcrumb Points
1. **`auth.signout.init`** - When sign-out button clicked (component level)
2. **`auth.signout.api.start`** - Before `fetch("/api/auth/signout")`
3. **`auth.signout.api.done`** - After API response (include status code)
4. **`auth.signout.client.start`** - Before `supabase.auth.signOut()`
5. **`auth.signout.client.done`** - After client sign-out (include error if any)
6. **`auth.signout.navigate`** - Before `window.location.replace()`
7. **`auth.onAuthStateChange.SIGNED_OUT`** - When SIGNED_OUT event fires
8. **`auth.signout.cookies.verify`** - After navigation, verify cookie count (if possible)

#### Error Tracking
- Track `signOut()` errors (client-side failures)
- Track `/api/auth/signout` failures (server-side failures, but don't fail request)
- Track redirect loop detection (same route visited >3 times in 5 seconds)
- Track loading state timeout (isLoading stuck >8 seconds)

---

## TOP 3 FIXES BY ROI

### 1. Fix Cookie Clearing Race Condition (Approach A)
**ROI:** 🔴 **HIGHEST**
- **Impact:** Prevents "still logged in" after sign-out
- **Effort:** Low (await API route, add error handling)
- **Risk:** Low (minimal diff, defensive changes)
- **Files:** `components/auth/auth-provider.tsx`, `app/api/auth/signout/route.ts`

### 2. Remove Competing Sign-Out Handlers (Approach B)
**ROI:** 🟡 **MEDIUM**
- **Impact:** Makes sign-out feel snappier, removes duplicate redirect risk
- **Effort:** Low (remove code, simplify components)
- **Risk:** Low (removing code, not adding)
- **Files:** `app/talent/dashboard/client.tsx`, `app/settings/sections/account-settings.tsx`, `app/dashboard/client.tsx`

### 3. Fix Profile Fetch Duplication (Approach C - partial)
**ROI:** 🟢 **LOW**
- **Impact:** Makes sign-in slightly faster, reduces DB load
- **Effort:** Medium (requires careful gating logic)
- **Risk:** Medium (could break sign-in if gating wrong)
- **Files:** `components/auth/auth-provider.tsx`

---

## BIGGEST RISK IF WE DO NOTHING

**Risk:** Users experience "still logged in" after sign-out, causing confusion and potential security issues.

**Scenario:**
1. User clicks "Sign Out"
2. `signOut()` calls `/api/auth/signout` but doesn't await it
3. `window.location.replace()` happens immediately
4. Cookies aren't cleared yet (API route still processing)
5. Middleware runs on next request, sees cookies, redirects back to dashboard
6. User sees dashboard briefly → then redirects to login → feels "stuck"

**Impact:**
- **User confusion:** "I signed out but I'm still logged in?"
- **Security risk:** If user closes browser before cookies clear, session persists
- **Support burden:** Users report bugs, support team investigates

**Mitigation if we do nothing:**
- Users must manually clear cookies or hard refresh
- Workaround: Close browser completely (clears session)

---

## DEFINITION OF DONE FOR PRODUCTION AUTH UX

### Must Have (P0)
- ✅ Sign-out clears all cookies within 1 second
- ✅ Sign-out redirects to `/login?signedOut=true` within 1 second
- ✅ UI shows no user/profile data after sign-out
- ✅ No redirect loops during sign-out
- ✅ Sign-in redirects to dashboard within 2 seconds
- ✅ Loading states never stuck >8 seconds

### Should Have (P1)
- ✅ Sign-out handles network failures gracefully (still redirects)
- ✅ Sign-in doesn't duplicate profile fetches
- ✅ Sentry breadcrumbs track auth transitions for debugging

### Nice to Have (P2)
- ✅ Sign-out feels instant (< 500ms perceived latency)
- ✅ Sign-in feels instant (< 1 second perceived latency)
- ✅ Cross-tab sign-out works correctly (already works, verify)

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

**Recommendation:** Implement **Approach A** first (highest ROI, lowest risk), then **Approach B** (removes competing handlers), then **Approach C** (optimization). All three can be done in sequence without conflicts.
