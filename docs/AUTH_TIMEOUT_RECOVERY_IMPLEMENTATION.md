# Auth Timeout Recovery Implementation

**Date:** January 20, 2025  
**Status:** ✅ IMPLEMENTED  
**Purpose:** Fix infinite loading spinner on talent dashboard (works in incognito, fails in normal Chrome profile)

---

## Problem Summary

**Symptom:** Talent dashboard shows infinite loading spinner in normal Chrome profile, but works fine in incognito.

**Root Cause Hypothesis:** Stale Supabase auth tokens in localStorage/cookies cause auth bootstrap to never resolve. Incognito works because it has clean storage.

---

## Implementation: Approach B (Timeout Guard + Clear Session UI)

### Files Changed

1. ✅ `components/auth/auth-provider.tsx` - Added timeout guard + breadcrumbs
2. ✅ `components/auth/auth-timeout-recovery.tsx` - New recovery UI component

---

## Changes Made

### 1. Timeout Guard (`components/auth/auth-provider.tsx`)

**Added:**
- 8-second timeout that triggers if `isLoading` remains `true`
- Shows recovery UI when timeout triggers
- Clears timeout when bootstrap completes

**Key Code:**
```typescript
// Set 8-second timeout guard
timeoutRef.current = setTimeout(() => {
  if (mounted && isLoading) {
    console.warn("[auth.timeout] Bootstrap exceeded 8s threshold");
    breadcrumb({ phase: "timeout", threshold: 8000 });
    setShowTimeoutRecovery(true);
  }
}, 8000);
```

### 2. Minimal Breadcrumbs

**Added breadcrumbs at 5 checkpoints:**
1. `[auth.init]` - AuthProvider mount
2. `[auth.getSession.done]` - Session read result
3. `[auth.ensureAndHydrateProfile.done]` - Profile hydration result
4. `[auth.bootstrap.complete]` - Loading resolved
5. `[auth.timeout]` - Timeout triggered

**Console logs:**
- `[auth.init] Starting auth bootstrap`
- `[auth.onAuthStateChange] Event: <event>`
- `[auth.bootstrap.complete] Auth bootstrap finished successfully`
- `[auth.timeout] Bootstrap exceeded 8s threshold`

**Sentry breadcrumbs:**
- Same sequence sent to Sentry for production debugging
- Includes timestamps, user IDs, profile roles

### 3. Clear Session Recovery UI (`components/auth/auth-timeout-recovery.tsx`)

**Recovery button does:**
1. ✅ Resets browser client singleton (`resetSupabaseBrowserClient()`)
2. ✅ Attempts `signOut({ scope: "global" })` (best effort - may fail if stuck)
3. ✅ Wipes all Supabase storage keys from localStorage:
   - Finds all keys containing `sb-` or `supabase`
   - Removes them individually
   - Clears sessionStorage
4. ✅ Hard reloads to `/login?cleared=1`

**Why this works:**
- Incognito works because it has clean storage
- Recovery button replicates incognito behavior by wiping storage
- Hard reload ensures clean state

---

## Testing Procedures

### Test 1: Reproduce Infinite Loading (Normal Chrome)

**Steps:**
1. Open normal Chrome profile (with existing cookies/localStorage)
2. Navigate to `/talent/dashboard`
3. Wait 8 seconds

**Expected:**
- ✅ Timeout recovery UI appears
- ✅ Console shows: `[auth.timeout] Bootstrap exceeded 8s threshold`
- ✅ Sentry breadcrumb: `auth.timeout` with threshold: 8000

### Test 2: Recovery Button

**Steps:**
1. Trigger timeout UI (Test 1)
2. Click "Clear Session & Reload"
3. Verify storage cleared:
   - Open DevTools → Application → Local Storage
   - Verify no `sb-*` keys remain
4. Verify redirect to `/login?cleared=1`

**Expected:**
- ✅ Storage keys removed
- ✅ Redirects to login
- ✅ Can sign in fresh
- ✅ Dashboard loads successfully

### Test 3: Incognito (Should Not Timeout)

**Steps:**
1. Open incognito Chrome
2. Navigate to `/talent/dashboard`
3. Sign in
4. Wait 8 seconds

**Expected:**
- ✅ Dashboard loads within 2-3 seconds
- ✅ No timeout UI appears
- ✅ Console shows: `[auth.bootstrap.complete]`

### Test 4: Console Log Sequence

**Steps:**
1. Open DevTools → Console
2. Reproduce infinite loading
3. Check console logs

**Expected sequence:**
```
[auth.init] Starting auth bootstrap
[auth.onAuthStateChange] Event: INITIAL_SESSION
[auth.getSession.done] hasSession: true, userId: <uuid>
[auth.ensureAndHydrateProfile_start] userId: <uuid>
[auth.ensureAndHydrateProfile_done] hasProfile: true
[auth.bootstrap.complete] Auth bootstrap finished successfully
```

**OR if timeout:**
```
[auth.init] Starting auth bootstrap
[auth.getSession.done] hasSession: true
... (stalls here)
[auth.timeout] Bootstrap exceeded 8s threshold
```

### Test 5: Sentry Breadcrumbs

**Steps:**
1. Reproduce infinite loading
2. Check Sentry dashboard
3. Look for breadcrumbs

**Expected:**
- ✅ Breadcrumb: `auth.bootstrap` with `phase: "init_start"`
- ✅ Breadcrumb: `auth.bootstrap` with `phase: "getSession_done"`
- ✅ Breadcrumb: `auth.bootstrap` with `phase: "timeout"` (if timeout)
- ✅ All breadcrumbs include timestamps

---

## Network Tab Diagnosis

**To answer: "profiles request: yes/no, status: ___"**

**Steps:**
1. Open DevTools → Network tab
2. Filter by `profiles` or `supabase`
3. Reproduce infinite loading
4. Check for `profiles?...` request

**Possible outcomes:**

| Request Status | Meaning | Fix |
|----------------|---------|-----|
| **200** | Session exists, RLS allows | Profile fetch succeeded, check why `isLoading` stuck |
| **401** | Session expired/invalid | Stale token issue - recovery button fixes |
| **406** | Profile missing (`.single()` error) | Should use `.maybeSingle()` - check query |
| **0 (canceled)** | Request never fired | Auth bootstrap never reached profile fetch |
| **No request** | Bootstrap stuck before query | Check `getSession()` - likely stale localStorage |

---

## Compliance Verification

### ✅ Coding Standards

- **TypeScript:** Uses generated types, no `any`
- **Error Handling:** Comprehensive logging + Sentry
- **Security:** Uses `getUser()` not `getSession()` (already compliant)
- **Database:** Uses `.maybeSingle()` for profile queries

### ✅ Architecture Constitution

- **No DB writes in client:** Recovery UI only clears storage, no DB mutations
- **Mutations server-side:** N/A (recovery only)
- **RLS respected:** No queries in recovery UI
- **Red Zone:** Minimal changes, reversible

### ✅ Airport Model

- **Terminal Zone:** Recovery UI component (presentational only)
- **Ticketing Zone:** Auth provider timeout guard (observation only)
- **No zone violations**

---

## Expected Behaviors

### Normal Chrome (Stale Storage)
- ⏱️ Loading spinner shows
- ⏱️ After 8s: Timeout recovery UI appears
- ✅ User clicks "Clear Session"
- ✅ Storage wiped, redirects to login
- ✅ Fresh sign-in works

### Incognito (Clean Storage)
- ✅ Loading completes in 2-3s
- ✅ No timeout UI
- ✅ Dashboard loads normally

---

## Next Steps

1. ✅ **Code implemented** - Timeout guard + recovery UI
2. ⏭️ **Test in normal Chrome** - Reproduce infinite loading
3. ⏭️ **Check Network tab** - Answer: "profiles request: yes/no, status: ___"
4. ⏭️ **Verify recovery** - Click "Clear Session", confirm it works
5. ⏭️ **Check Sentry** - Verify breadcrumbs captured

---

## Related Documentation

- `docs/INFINITE_LOADING_DEBUG_PLAN.md` - Original plan
- `docs/CODING_STANDARDS.md` - Coding standards compliance
- `docs/ARCHITECTURE_CONSTITUTION.md` - Architectural rules

---

**RED ZONE INVOLVED: YES**

**Red Zone Files Modified:**
- `components/auth/auth-provider.tsx` - Auth state owner

**Changes:**
- Minimal, reversible diffs
- Timeout guard only (no logic changes)
- Recovery UI (presentational only)
- Breadcrumbs (logging only)

**Loop Safety:**
- Timeout guard doesn't trigger redirects
- Recovery button uses hard reload (breaks any loops)
- No middleware changes
