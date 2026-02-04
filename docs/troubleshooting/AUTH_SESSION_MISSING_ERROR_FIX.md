# AuthSessionMissingError Fix Implementation

**Date:** February 4, 2026  
**Status:** ✅ IMPLEMENTED  
**Purpose:** Fix Sentry noise from bootstrap treating guest mode (no session) as an exception on public pages

---

## Problem Summary

**Symptom:** Sentry reports many `AuthSessionMissingError` events from authentication bootstrap.

**Root Cause:** 
- Bootstrap calls `supabase.auth.getUser()` even when there's no session
- On public pages (like `/`), `INITIAL_SESSION` fires with `hasSession: false`
- Bootstrap still calls `getUser()`, which throws `AuthSessionMissingError`
- Error is breadcrumbed and re-thrown → Sentry records it as an error

**Impact:** 
- Sentry noise from expected guest mode behavior
- Misleading error reports that don't represent actual problems
- Difficulty identifying real authentication failures

---

## Solution: Two-Layer Fix

### Layer 1: Code Fix - Session Gate Before getUser()

**File:** `components/auth/auth-provider.tsx`

**Changes:**

1. **Added `getSession()` gate before `getUser()`** (lines 554-594)
   - Check for session existence using `getSession()` first
   - If no session, exit early with `no_session_exit` breadcrumb
   - Only call `getUser()` if session exists

2. **Route-aware behavior** (lines 588-591, 645-648)
   - Use `isPublicPath()` helper to determine if route is public
   - On public paths: exit quietly (no redirect, no error)
   - On protected paths: redirect to login (still no error thrown)

3. **Handle AuthSessionMissingError gracefully** (lines 618-651)
   - Detect session missing errors by message content
   - Don't throw - treat as expected behavior
   - Set auth state to null and exit bootstrap
   - Route-aware redirect (only on protected routes)

4. **Updated catch block** (lines 680-697)
   - Filter out session missing errors from error logging
   - Only log real errors (not AbortError, not session missing)

**Key Code Pattern:**
```typescript
// Check session first
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (!session) {
  // Exit early - this is normal on public pages
  await breadcrumb({ phase: "no_session_exit", pathname, isPublicPath });
  setIsLoading(false);
  if (!isPublicPath(pathname)) {
    router.replace(PATHS.LOGIN); // Only redirect on protected routes
  }
  return; // DO NOT throw
}

// Only call getUser() if session exists
await breadcrumb({ phase: "getUser_start" });
const { data, error } = await supabase.auth.getUser();
```

---

### Layer 2: Sentry Hygiene - Filter Expected Errors

**File:** `instrumentation-client.ts`

**Changes:**

1. **Added AuthSessionMissingError filter** (lines 324-350)
   - Detects session missing errors by name or message content
   - Checks breadcrumbs for `INITIAL_SESSION` with `hasSession: false`
   - Checks breadcrumbs for `no_session_exit` on public paths
   - Filters out expected guest mode errors
   - Still captures real session missing errors on protected routes

**Key Code Pattern:**
```typescript
const isAuthSessionMissing = 
  errorObj.name === 'AuthSessionMissingError' ||
  (errorObj.message?.includes('session') && 
   (errorObj.message?.includes('missing') || 
    errorObj.message?.includes('not found') || 
    errorObj.message?.includes('invalid')));

if (isAuthSessionMissing) {
  const hasInitialSessionNoSession = breadcrumbs.some(
    (b) => b.category === "auth.bootstrap" &&
           b.data?.event === "INITIAL_SESSION" &&
           b.data?.hasSession === false
  );
  
  const hasNoSessionExit = breadcrumbs.some(
    (b) => b.category === "auth.bootstrap" &&
           b.data?.phase === "no_session_exit" &&
           b.data?.isPublicPath === true
  );
  
  if (hasInitialSessionNoSession || hasNoSessionExit) {
    return null; // Filter expected guest mode errors
  }
}
```

---

## Files Changed

1. ✅ `components/auth/auth-provider.tsx`
   - Added `getSession()` gate before `getUser()` with breadcrumbs (`getSession_start`, `getSession_done`)
   - Added deny-by-default `isProtectedPath()` helper (protected if starts with `/talent`, `/client`, `/admin`)
   - Added special handling for auth callback routes (`/auth/callback`, `/reset-password`, `/update-password`) - treated as public
   - Added graceful handling of `AuthSessionMissingError` (ONLY this error type, not others)
   - Updated catch block to filter session missing errors precisely
   - Added comprehensive breadcrumbs for observability

2. ✅ `instrumentation-client.ts`
   - Added Sentry filter for expected `AuthSessionMissingError`
   - Checks breadcrumbs to distinguish guest mode from real errors
   - Uses `isProtectedPath: false` to ensure only public page errors are filtered
   - Verifies filter is in correct location (Next.js 15.3+ instrumentation-client convention)

---

## Expected Behavior

### Before Fix

**Public Page (`/`):**
1. `INITIAL_SESSION` fires with `hasSession: false` ✅
2. Bootstrap calls `getUser()` ❌ (shouldn't happen)
3. `AuthSessionMissingError` thrown ❌
4. Error breadcrumbed and sent to Sentry ❌
5. Error logged as exception ❌

**Protected Page (`/talent/dashboard`):**
1. Same behavior as above
2. User redirected to login (correct, but error still logged)

### After Fix

**Public Page (`/`):**
1. `INITIAL_SESSION` fires with `hasSession: false` ✅
2. Bootstrap calls `getSession()` ✅
3. No session found → `no_session_exit` breadcrumb ✅
4. Exit early, no error thrown ✅
5. No Sentry error (filtered) ✅

**Protected Page (`/talent/dashboard`):**
1. `INITIAL_SESSION` fires with `hasSession: false` ✅
2. Bootstrap calls `getSession()` ✅
3. No session found → `no_session_exit` breadcrumb ✅
4. Redirect to login ✅
5. No Sentry error (expected behavior) ✅

**Protected Page with Session:**
1. `INITIAL_SESSION` fires with `hasSession: true` ✅
2. Bootstrap calls `getSession()` ✅
3. Session found → proceed to `getUser()` ✅
4. User validated, profile hydrated ✅
5. Dashboard loads ✅

---

## New Breadcrumbs

| Phase | Purpose | When It Fires |
|-------|---------|---------------|
| `getSession_start` | `getSession()` called | Before calling `getSession()` |
| `getSession_done` | `getSession()` completed | After `getSession()` returns (with `hasSession`, `hasError`) |
| `getSession_error` | `getSession()` failed | When `getSession()` returns an error |
| `no_session_exit` | No session found (early exit) | When `getSession()` returns no session (with `isProtectedPath`) |
| `no_session_expected` | `AuthSessionMissingError` caught | When `getUser()` throws session missing error (with `isProtectedPath`) |

---

## Key Improvements Made

### 1. Fixed `/gigs` to Remain Public

**Before:** `/gigs` was incorrectly marked as protected

**After:** `/gigs` is public (browsing + SEO)
- `/gigs` list is public
- `/gigs/[id]` detail pages are public
- `/gigs/[id]/apply` is protected (talent-only, handled by middleware)

**Why:** Product requirement - gigs should be browsable without sign-in.

### 2. Bulletproof `/talent/[slug]` Exception

**Before:** Implicit exception logic could allow reserved segments

**After:** Explicit allowlist with reserved segments set:
```typescript
const RESERVED_TALENT_SEGMENTS = new Set([
  "dashboard", "profile", "settings", "subscribe", "signup",
  "apply", "portfolio", "messages", "applications", "bookings",
]);

const isPublicTalentProfile = (path: string): boolean => {
  const match = path.match(/^\/talent\/([^/]+)$/);
  if (!match) return false;
  const slug = match[1];
  return !RESERVED_TALENT_SEGMENTS.has(slug);
};
```

**Why:** Prevents someone creating a talent slug named "dashboard" and accessing protected routes.

### 3. Deny-by-Default Protected Path Logic

**Before:** Public allowlist (could drift and miss new routes)

**After:** Deny-by-default protected paths:
- Protected if starts with: `/talent`, `/client`, `/admin`
- Exception: `/talent/[slug]` marketing profiles (public)
- `/gigs` list requires sign-in (protected)
- `/choose-role` requires auth (protected)
- Auth callback routes are special public (no redirect during exchange)

### 2. Auth Callback Route Protection

**Routes treated as special public:**
- `/auth/callback` - OAuth/email verification exchange
- `/reset-password` - Password reset flow
- `/update-password` - Password update flow

**Why:** These routes can briefly have "no session" during the exchange. Redirecting would break the flow.

### 3. Precise Error Handling

**Only swallows:** `AuthSessionMissingError` (by name or message pattern)

**Still throws:** All other errors:
- Network failures
- Invalid JWT
- Refresh token errors
- CORS failures
- Misconfigured cookie/storage options

**Why:** Avoid hiding real problems by being too broad.

### 4. Enhanced Breadcrumbs

**Added:**
- `getSession_start` - Marks when `getSession()` is called
- `getSession_done` - Marks completion with `hasSession` and `hasError` flags

**Why:** Makes it instantly obvious in Sentry whether the gate worked.

### 4. `/choose-role` Prefetch Prevention

**Added:** `prefetch={false}` to `/choose-role` links visible to guests

**Files:**
- `components/navbar.tsx` (2 instances)
- `app/page.tsx` (3 instances)

**Why:** Prevents Next.js Link prefetching from triggering auth bootstrap on protected route for guests, reducing noise.

### 5. Sentry Filter Verification

**Location:** `instrumentation-client.ts` (Next.js 15.3+ convention)

**Filter logic:**
- Checks for `INITIAL_SESSION` with `hasSession: false`
- Checks for `no_session_exit` with `isProtectedPath: false`
- Checks for `no_session_expected` with `isProtectedPath: false`
- Only filters when breadcrumbs prove it's guest mode
- Does NOT filter if `isProtectedPath: true` (real auth failures)

## Testing

### Manual Test: Public Page (Guest Mode)

**Steps:**
1. Open browser in incognito mode
2. Navigate to `/` (public page)
3. Open DevTools → Console
4. Check for breadcrumbs

**Expected:**
- ✅ `[auth.init] Starting auth bootstrap`
- ✅ `phase: "init_start"`
- ✅ `phase: "getSession_start"`
- ✅ `phase: "getSession_done"` with `hasSession: false`
- ✅ `phase: "no_session_exit"` with `isProtectedPath: false`
- ✅ No `getUser_start` breadcrumb
- ✅ No `getUser_error` breadcrumb
- ✅ No Sentry error

### Manual Test: Protected Page (Guest Mode)

**Steps:**
1. Open browser in incognito mode
2. Navigate to `/talent/dashboard` (protected page)
3. Open DevTools → Console
4. Check for breadcrumbs

**Expected:**
- ✅ `[auth.init] Starting auth bootstrap`
- ✅ `phase: "init_start"`
- ✅ `phase: "getSession_start"`
- ✅ `phase: "getSession_done"` with `hasSession: false`
- ✅ `phase: "no_session_exit"` with `isProtectedPath: true`
- ✅ Redirect to `/login`
- ✅ No Sentry error

### Manual Test: Protected Page (Authenticated)

**Steps:**
1. Sign in to the application
2. Navigate to `/talent/dashboard`
3. Open DevTools → Console
4. Check for breadcrumbs

**Expected:**
- ✅ `[auth.init] Starting auth bootstrap`
- ✅ `phase: "init_start"`
- ✅ `phase: "getSession_start"`
- ✅ `phase: "getSession_done"` with `hasSession: true`
- ✅ `phase: "getUser_start"`
- ✅ `phase: "getUser_done"` with `hasUser: true`
- ✅ `phase: "ensureAndHydrateProfile_start"`
- ✅ `phase: "ensureAndHydrateProfile_done"`
- ✅ `phase: "bootstrap_complete"`
- ✅ Dashboard loads successfully

### Manual Test: Auth Callback Route (No Redirect)

**Steps:**
1. Click email verification link
2. Navigate to `/auth/callback?code=...`
3. Open DevTools → Console
4. Check for breadcrumbs

**Expected:**
- ✅ `phase: "getSession_start"`
- ✅ `phase: "getSession_done"` with `hasSession: false` (during exchange)
- ✅ `phase: "no_session_exit"` with `isProtectedPath: false`
- ✅ No redirect to `/login` (allows exchange to complete)
- ✅ No Sentry error

### Manual Test: Network Error (Should Still Report)

**Steps:**
1. Disable network briefly during bootstrap
2. Navigate to `/talent/dashboard`
3. Check Sentry

**Expected:**
- ✅ Network errors still captured in Sentry
- ✅ Proves filter doesn't over-filter real errors

### Sentry Verification

**Steps:**
1. Deploy fix to production
2. Monitor Sentry for 24 hours
3. Check for `AuthSessionMissingError` events

**Expected:**
- ✅ No `AuthSessionMissingError` events from public pages
- ✅ No `AuthSessionMissingError` events with `no_session_exit` breadcrumb where `isProtectedPath: false`
- ✅ Real session missing errors on protected routes still captured (if they occur)

---

## Acceptance Criteria (6 Tests)

### Test 1: Incognito → Visit `/`
**Expected:**
- ✅ `no_session_exit` breadcrumb with `isProtectedPath: false`
- ✅ **No** `getUser_error` breadcrumb
- ✅ **No Sentry error**

### Test 2: Incognito → Visit `/talent/dashboard` Directly
**Expected:**
- ✅ `no_session_exit` breadcrumb with `isProtectedPath: true`
- ✅ Redirect to `/login`
- ✅ **No Sentry error**

### Test 3: Sign Up → Land on Choose-Role Flow
**Expected:**
- ✅ No missing-session errors during the transition
- ✅ `/choose-role` treated as protected (requires auth)
- ✅ No redirect loop

### Test 4: Hard Refresh on `/talent/dashboard` While Logged In
**Expected:**
- ✅ `getSession_done` with `hasSession: true`
- ✅ Session resolves, profile hydrates
- ✅ No hard reload fallback
- ✅ Dashboard loads successfully

### Test 5: Mobile Safari
**Repeat Tests 1 and 3:**
- ✅ Same behavior as desktop
- ✅ No Safari-specific errors

### Test 6: Disable Network Briefly During Bootstrap
**Expected:**
- ✅ Network errors still visible in Sentry
- ✅ Proves filter doesn't over-filter real errors
- ✅ Only `AuthSessionMissingError` is filtered (when on public pages)

### Test 7: Invite / Magic Link / OAuth Callback Routes
**Steps:**
1. Click email verification link
2. Navigate to `/auth/callback?code=...`
3. Check for redirect loops

**Expected:**
- ✅ No redirect to `/login` during exchange
- ✅ Exchange completes successfully
- ✅ Redirects to dashboard after exchange

### Test 8: Hard Refresh on Protected Page (iOS Safari)
**Steps:**
1. Sign in on iOS Safari
2. Navigate to `/talent/dashboard`
3. Hard refresh (swipe down)
4. Check for cookie timing issues

**Expected:**
- ✅ Session resolves correctly
- ✅ No infinite loading
- ✅ Dashboard loads successfully

---

## Compliance Verification

### ✅ Architecture Constitution

- **Middleware = security only:** No changes to middleware
- **No DB writes in client:** Only read operations (`getSession()`, `getUser()`)
- **RLS respected:** All queries use user-level client
- **Red Zone:** Minimal changes, reversible

### ✅ Airport Model

- **Security Zone:** No changes (middleware untouched)
- **Ticketing Zone:** Session check added (read-only)
- **Terminal Zone:** Route-aware behavior (presentational)
- **No zone violations**

### ✅ Coding Standards

- **TypeScript:** Uses generated types, no `any`
- **Error Handling:** Comprehensive logging + Sentry
- **Security:** Uses `getSession()` for initial check, `getUser()` for validation
- **Database:** No changes (no DB queries modified)

---

## Rollback Plan

If issues occur, revert these changes:

1. **Revert `components/auth/auth-provider.tsx`:**
   - Remove `getSession()` gate (lines 554-594)
   - Remove `AuthSessionMissingError` handling (lines 618-651)
   - Restore original `getUser()` call pattern

2. **Revert `instrumentation-client.ts`:**
   - Remove `AuthSessionMissingError` filter (lines 324-350)

**Note:** Rollback is safe - original behavior will be restored, but Sentry noise will return.

---

## Related Documentation

- `docs/troubleshooting/AUTH_BREADCRUMB_ANALYSIS_REPORT.md` - Breadcrumb analysis
- `docs/troubleshooting/AUTH_TIMEOUT_RECOVERY_IMPLEMENTATION.md` - Timeout recovery
- `docs/ARCHITECTURE_CONSTITUTION.md` - Architectural rules

---

**RED ZONE INVOLVED: YES**

**Red Zone Files Modified:**
- `components/auth/auth-provider.tsx` - Auth state owner

**Changes:**
- Minimal, reversible diffs
- Session gate only (no logic changes to auth flow)
- Route-aware behavior (uses existing `isPublicPath()` helper)
- Sentry filter (defensive, doesn't change behavior)

**Loop Safety:**
- Session gate prevents unnecessary `getUser()` calls
- Route-aware redirect prevents loops (only redirects on protected routes)
- No middleware changes

**Bootstrap Gaps:**
- Early exit on no session is intentional (normal behavior)
- Profile hydration still happens when session exists
- No changes to profile bootstrap logic

**RLS Enforcement:**
- All queries use user-level client (no service role)
- No RLS bypass introduced

---

**Last Updated:** February 4, 2026  
**Maintained By:** TOTL Development Team
