# 🔍 Auth Breadcrumb Analysis Report

**Date:** February 4, 2026  
**Status:** Complete Analysis  
**Purpose:** Comprehensive documentation of authentication breadcrumb strings and their role in debugging auth bootstrap issues

---

## 📋 Table of Contents

- [Overview](#overview)
- [Breadcrumb Strings Analyzed](#breadcrumb-strings-analyzed)
- [Implementation Locations](#implementation-locations)
- [Breadcrumb Flow Sequence](#breadcrumb-flow-sequence)
- [Integration with Sentry](#integration-with-sentry)
- [Related Debugging Infrastructure](#related-debugging-infrastructure)
- [Usage Patterns](#usage-patterns)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Overview

This report documents four critical breadcrumb strings used throughout the TOTL authentication system:

1. **`getUser_start`** - Marks the beginning of user session retrieval
2. **`getUser_error`** - Captures errors during user session retrieval
3. **`auth.bootstrap`** - Category for all authentication bootstrap breadcrumbs
4. **`INITIAL_SESSION`** - Auth state change event fired on initial session check

These breadcrumbs are part of a comprehensive observability system designed to debug authentication bootstrap issues, particularly the "infinite loading spinner" problem that occurs in normal Chrome profiles but not in incognito mode.

---

## 🔖 Breadcrumb Strings Analyzed

### 1. `getUser_start`

**Purpose:** Marks the start of the `getUser()` call in the auth bootstrap sequence.

**Location:** `components/auth/auth-provider.tsx:555`

**Context:**
```typescript
// Breadcrumb: user read start
await breadcrumb({ phase: "getUser_start" });

let currentUser: User | null = null;
for (let attempt = 0; attempt < 2; attempt++) {
  try {
    const { data, error } = await supabase.auth.getUser();
    // ... error handling
  }
}
```

**When It Fires:**
- On AuthProvider mount
- During `initialSession()` bootstrap function
- Before attempting to retrieve the current user session

**Data Captured:**
- `phase: "getUser_start"`
- `timestamp` (via breadcrumb wrapper)
- `userId` (null at this point, set later)

**Related Breadcrumbs:**
- `getUser_done` - Success case
- `getUser_error` - Error case
- `getUser_abort_retry` - AbortError retry case

---

### 2. `getUser_error`

**Purpose:** Captures errors that occur during `getUser()` calls, including network failures, abort errors, and authentication failures.

**Location:** `components/auth/auth-provider.tsx:575`

**Context:**
```typescript
} catch (error) {
  if (error instanceof Error && error.name === "AbortError" && attempt === 0) {
    await breadcrumb({ phase: "getUser_abort_retry", attempt });
    await sleep(100 + Math.floor(Math.random() * 200));
    continue;
  }
  if (error instanceof Error && error.name === "AbortError") {
    logger.debug("[auth.init] Bootstrap aborted during navigation (expected)");
    await breadcrumb({ phase: "aborted", reason: "navigation" });
    return;
  }
  await breadcrumb({ 
    phase: "getUser_error", 
    error: error instanceof Error ? error.message : String(error) 
  });
  throw error;
}
```

**When It Fires:**
- When `getUser()` throws a non-AbortError exception
- After retry attempts are exhausted
- When authentication fails due to invalid/expired tokens

**Data Captured:**
- `phase: "getUser_error"`
- `error`: Error message string
- `timestamp` (via breadcrumb wrapper)

**Error Types Handled:**
- **AbortError**: Filtered separately (expected during navigation)
- **Network errors**: Captured for debugging
- **Auth failures**: Invalid tokens, expired sessions

**Related Breadcrumbs:**
- `getUser_start` - Preceding breadcrumb
- `getUser_abort_retry` - AbortError retry case
- `aborted` - Navigation abort case

---

### 3. `auth.bootstrap` (Category)

**Purpose:** Sentry breadcrumb category that groups all authentication bootstrap-related breadcrumbs for easy filtering and analysis.

**Locations:**
- `components/auth/auth-provider.tsx` (multiple locations)
- `instrumentation-client.ts:189`

**Usage Pattern:**
```typescript
const breadcrumb = async (data: Record<string, unknown>) => {
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.addBreadcrumb({
      category: "auth.bootstrap",
      message: "auth.init", // or other message
      level: "info",
      data: { timestamp: new Date().toISOString(), ...data },
    });
  } catch {
    // Sentry not available, skip
  }
};
```

**Breadcrumb Phases in This Category:**

| Phase | Location | Purpose |
|-------|----------|---------|
| `init_start` | auth-provider.tsx:511 | Bootstrap initialization begins |
| `getUser_start` | auth-provider.tsx:555 | User retrieval starts |
| `getUser_done` | auth-provider.tsx:580 | User retrieval completes |
| `getUser_error` | auth-provider.tsx:575 | User retrieval fails |
| `getUser_abort_retry` | auth-provider.tsx:566 | AbortError retry attempt |
| `aborted` | auth-provider.tsx:572 | Bootstrap aborted (navigation) |
| `no_user_exit` | auth-provider.tsx:591 | No user found, exit bootstrap |
| `ensureAndHydrateProfile_start` | auth-provider.tsx:608 | Profile hydration begins |
| `ensureAndHydrateProfile_done` | auth-provider.tsx:619 | Profile hydration completes |
| `bootstrap_complete` | auth-provider.tsx:628 | Bootstrap successfully finished |
| `timeout_soft` | auth-provider.tsx:523 | Soft timeout (8s) exceeded |
| `timeout_hard` | auth-provider.tsx:536 | Hard timeout (12s) exceeded |
| `profile_fetch_aborted` | auth-provider.tsx:637 | Profile fetch aborted |
| `profile_hydration_error` | auth-provider.tsx:642 | Profile hydration error |
| `error` | auth-provider.tsx:649 | General bootstrap error |
| `auth.onAuthStateChange.*` | auth-provider.tsx:763 | Auth state change events |

**Sentry Filtering:**
- Filter by category: `auth.bootstrap`
- Filter by phase: `phase: "getUser_start"`
- Filter by message: `message: "auth.init"`

---

### 4. `INITIAL_SESSION` (Event)

**Purpose:** Auth state change event fired by Supabase when the initial session is detected during AuthProvider initialization.

**Location:** `components/auth/auth-provider.tsx:682` (via `onAuthStateChange` callback)

**Context:**
```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  // Event can be: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
  logger.debug("[auth.onAuthStateChange]", {
    event,
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    pathname: currentPathname,
    cookieSb,
  });
  
  // Breadcrumb logged at line 772
  void breadcrumb({ event, hasSession: !!currentSession, userId: currentSession?.user?.id || null });
});
```

**When It Fires:**
- On AuthProvider mount
- When Supabase detects an existing session in cookies/localStorage
- Before `initialSession()` completes
- Can race with `initialSession()` bootstrap

**Event Sequence:**
1. AuthProvider mounts
2. `onAuthStateChange` listener registered
3. Supabase checks for existing session
4. If session exists → `INITIAL_SESSION` event fires
5. `initialSession()` bootstrap runs (may race with event)

**Data Captured:**
- `event: "INITIAL_SESSION"`
- `hasSession: boolean`
- `userId: string | null`
- `pathname: string`
- `cookieSb: boolean` (cookie presence check)

**Related Events:**
- `SIGNED_IN` - User signs in
- `SIGNED_OUT` - User signs out
- `TOKEN_REFRESHED` - Token refresh
- `USER_UPDATED` - User metadata updated

**Race Condition Handling:**
- `INITIAL_SESSION` can fire before `initialSession()` completes
- `SIGNED_IN` can race with `initialSession()` bootstrap
- Code handles this by checking `hasHandledInitialSession` flag (though currently not gated)

---

## 📍 Implementation Locations

### Primary File: `components/auth/auth-provider.tsx`

**Line-by-Line Breakdown:**

| Line | Breadcrumb/Event | Context |
|------|------------------|---------|
| 235 | `auth.bootstrap` | `ensureAndHydrateProfile` breadcrumb wrapper |
| 500 | `auth.bootstrap` | `initialSession` breadcrumb wrapper |
| 511 | `phase: "init_start"` | Bootstrap initialization begins |
| 555 | `phase: "getUser_start"` | User retrieval starts |
| 566 | `phase: "getUser_abort_retry"` | AbortError retry attempt |
| 572 | `phase: "aborted"` | Bootstrap aborted during navigation |
| 575 | `phase: "getUser_error"` | User retrieval error |
| 580 | `phase: "getUser_done"` | User retrieval completes |
| 591 | `phase: "no_user_exit"` | No user found, exit bootstrap |
| 608 | `phase: "ensureAndHydrateProfile_start"` | Profile hydration begins |
| 619 | `phase: "ensureAndHydrateProfile_done"` | Profile hydration completes |
| 628 | `phase: "bootstrap_complete"` | Bootstrap successfully finished |
| 632 | `[auth.bootstrap.complete]` | Console log (not breadcrumb) |
| 637 | `phase: "profile_fetch_aborted"` | Profile fetch aborted |
| 642 | `phase: "profile_hydration_error"` | Profile hydration error |
| 649 | `phase: "error"` | General bootstrap error |
| 682 | `onAuthStateChange` callback | Listens for INITIAL_SESSION event |
| 763 | `auth.bootstrap` | Auth state change breadcrumb |
| 772 | Breadcrumb logged | `INITIAL_SESSION` event captured |

### Secondary File: `instrumentation-client.ts`

**Line 189:** Filters Supabase auth-js lock AbortErrors and adds breadcrumb:
```typescript
Sentry.addBreadcrumb({
  category: "auth.bootstrap",
  message: "supabase_lock_abort_filtered",
  level: "info",
  data: {
    errorName: errorObj.name,
    errorMessage: errorObj.message,
  },
});
```

**Purpose:** Tracks filtered AbortErrors from Supabase auth locks (expected during navigation).

---

## 🔄 Breadcrumb Flow Sequence

### Normal Bootstrap Flow (Success Path)

```
1. [auth.init] Starting auth bootstrap
   └─ Breadcrumb: auth.bootstrap, phase: "init_start"

2. [auth.onAuthStateChange] Event: INITIAL_SESSION
   └─ Breadcrumb: auth.bootstrap, message: "auth.onAuthStateChange.INITIAL_SESSION"

3. Breadcrumb: phase: "getUser_start"
   └─ Attempting supabase.auth.getUser()

4. Breadcrumb: phase: "getUser_done"
   └─ hasUser: true, userId: <uuid>

5. Breadcrumb: phase: "ensureAndHydrateProfile_start"
   └─ userId: <uuid>

6. Breadcrumb: phase: "ensureAndHydrateProfile_done"
   └─ hasProfile: true, profileRole: "talent" | "client"

7. [auth.bootstrap.complete] Auth bootstrap finished successfully
   └─ Breadcrumb: phase: "bootstrap_complete", elapsedMs: <duration>
```

### Error Flow (getUser Fails)

```
1. [auth.init] Starting auth bootstrap
   └─ Breadcrumb: phase: "init_start"

2. Breadcrumb: phase: "getUser_start"

3. Error occurs during getUser()
   └─ Breadcrumb: phase: "getUser_error", error: "<error message>"

4. Bootstrap exits early
   └─ setIsLoading(false)
```

### AbortError Flow (Navigation During Bootstrap)

```
1. [auth.init] Starting auth bootstrap
   └─ Breadcrumb: phase: "init_start"

2. Breadcrumb: phase: "getUser_start"

3. AbortError during getUser() (first attempt)
   └─ Breadcrumb: phase: "getUser_abort_retry", attempt: 0

4. Retry after delay (100-300ms)

5a. Success on retry → Continue to getUser_done
5b. AbortError again → Breadcrumb: phase: "aborted", reason: "navigation"
   └─ Bootstrap exits (expected during navigation)
```

### Timeout Flow (Infinite Loading)

```
1. [auth.init] Starting auth bootstrap
   └─ Breadcrumb: phase: "init_start"

2. Breadcrumb: phase: "getUser_start"

3. getUser() hangs or takes too long
   └─ (No getUser_done breadcrumb)

4. After 8 seconds (soft timeout)
   └─ Breadcrumb: phase: "timeout_soft", threshold: 8000, elapsedMs: >8000

5. After 12 seconds (hard timeout)
   └─ Breadcrumb: phase: "timeout_hard", threshold: 12000, elapsedMs: >12000
   └─ setShowTimeoutRecovery(true) → Shows recovery UI
```

---

## 🔗 Integration with Sentry

### Sentry Configuration

**File:** `instrumentation-client.ts`

**Breadcrumb Collection:**
- All `auth.bootstrap` breadcrumbs are automatically sent to Sentry
- Dynamic import pattern: `await import("@sentry/nextjs")`
- Graceful degradation: If Sentry unavailable, breadcrumbs are skipped (no errors)

**Filtering in Sentry:**
- **Category filter:** `auth.bootstrap`
- **Message filter:** `auth.init`, `auth.onAuthStateChange.*`
- **Phase filter:** `phase: "getUser_start"`, `phase: "getUser_error"`, etc.
- **Tag filter:** `feature: "auth"`, `error_type: "auth_provider_profile_error"`

### Sentry Query Examples

**Find all getUser errors:**
```
category:auth.bootstrap phase:getUser_error
```

**Find timeout events:**
```
category:auth.bootstrap phase:timeout_soft OR phase:timeout_hard
```

**Find INITIAL_SESSION events:**
```
category:auth.bootstrap message:auth.onAuthStateChange.INITIAL_SESSION
```

**Find bootstrap failures:**
```
category:auth.bootstrap (phase:error OR phase:getUser_error OR phase:timeout_hard)
```

---

## 🛠️ Related Debugging Infrastructure

### 1. Console Logging

**Pattern:** Console logs mirror Sentry breadcrumbs for local debugging.

**Key Logs:**
- `[auth.init] Starting auth bootstrap` (line 510)
- `[auth.onAuthStateChange]` with event details (line 693)
- `[auth.bootstrap.complete] Auth bootstrap finished successfully` (line 632)
- `[auth.timeout] Bootstrap slow` (line 522)
- `[auth.timeout] Bootstrap exceeded timeout threshold` (line 532)

**Location:** `components/auth/auth-provider.tsx`

### 2. Timeout Recovery UI

**Component:** `components/auth/auth-timeout-recovery.tsx`

**Triggered By:**
- Hard timeout (12 seconds) → `setShowTimeoutRecovery(true)`

**Purpose:**
- Provides user-facing recovery option when bootstrap hangs
- Clears localStorage and redirects to login

**Related Breadcrumbs:**
- `phase: "timeout_hard"` triggers recovery UI

### 3. Debug Flags

**Environment Variable:** `DEBUG_ROUTING=1`

**Purpose:**
- Enables verbose middleware logging
- Helps diagnose redirect loops and routing issues

**Location:** `middleware.ts`

**Related to Breadcrumbs:**
- Middleware logs complement auth breadcrumbs
- Both help diagnose auth/bootstrap issues

### 4. Three Truths Logging

**Concept:** Proves three critical facts about auth state:
1. SIGNED_IN event fires
2. Cookies exist in browser
3. Middleware receives cookies

**Implementation:**
- `[auth.signIn]` logs (auth-provider.tsx:1010)
- `[auth.onAuthStateChange]` logs with cookie checks (auth-provider.tsx:693)
- Middleware logs with `DEBUG_ROUTING=1`

**Documentation:** `docs/troubleshooting/AUTH_THREE_TRUTHS_LOGGING_IMPLEMENTATION.md`

---

## 📊 Usage Patterns

### Pattern 1: Bootstrap Initialization

**When:** AuthProvider mounts

**Breadcrumbs:**
1. `phase: "init_start"`
2. `phase: "getUser_start"`
3. `phase: "getUser_done"` OR `phase: "getUser_error"`

**Use Case:** Track bootstrap start and user retrieval

### Pattern 2: Profile Hydration

**When:** User exists but profile needs hydration

**Breadcrumbs:**
1. `phase: "ensureAndHydrateProfile_start"`
2. `phase: "ensureAndHydrateProfile_done"` OR `phase: "profile_hydration_error"`

**Use Case:** Track profile fetch/creation during bootstrap

### Pattern 3: Error Tracking

**When:** Any error occurs during bootstrap

**Breadcrumbs:**
- `phase: "getUser_error"` - User retrieval fails
- `phase: "profile_hydration_error"` - Profile fetch fails
- `phase: "error"` - General bootstrap error

**Use Case:** Debug authentication failures in production

### Pattern 4: Timeout Detection

**When:** Bootstrap exceeds time thresholds

**Breadcrumbs:**
- `phase: "timeout_soft"` - 8 seconds (warning)
- `phase: "timeout_hard"` - 12 seconds (recovery UI)

**Use Case:** Identify infinite loading issues

### Pattern 5: Navigation Abort Tracking

**When:** User navigates during bootstrap

**Breadcrumbs:**
- `phase: "getUser_abort_retry"` - First abort, retrying
- `phase: "aborted"` - Aborted during navigation (expected)

**Use Case:** Filter expected AbortErrors from real errors

---

## 🔧 Troubleshooting Guide

### Issue: Infinite Loading Spinner

**Symptoms:**
- Dashboard shows loading spinner indefinitely
- Works in incognito but not normal Chrome profile

**Breadcrumbs to Check:**
1. `phase: "init_start"` - Bootstrap started?
2. `phase: "getUser_start"` - User retrieval started?
3. `phase: "getUser_done"` - User retrieval completed?
4. `phase: "timeout_soft"` / `phase: "timeout_hard"` - Timeout triggered?

**Diagnosis:**
- If `getUser_start` exists but no `getUser_done` → getUser() is hanging
- If `timeout_hard` exists → Bootstrap exceeded 12 seconds
- Check for `getUser_error` → Authentication failure

**Fix:**
- Use timeout recovery UI to clear session
- Check Sentry for error details
- Verify Supabase client initialization

### Issue: Profile Not Loading

**Symptoms:**
- User authenticated but profile is null
- Dashboard shows "loading" state

**Breadcrumbs to Check:**
1. `phase: "ensureAndHydrateProfile_start"` - Profile hydration started?
2. `phase: "ensureAndHydrateProfile_done"` - Profile hydration completed?
3. `phase: "profile_hydration_error"` - Profile fetch failed?

**Diagnosis:**
- If `ensureAndHydrateProfile_start` exists but no `done` → Profile fetch hanging
- If `profile_hydration_error` exists → Check error message

**Fix:**
- Check RLS policies for profiles table
- Verify user has profile row
- Check network tab for profile query status

### Issue: INITIAL_SESSION Race Condition

**Symptoms:**
- Multiple profile fetches
- Duplicate redirects
- Inconsistent auth state

**Breadcrumbs to Check:**
1. `message: "auth.onAuthStateChange.INITIAL_SESSION"` - Event fired?
2. `phase: "init_start"` - Bootstrap started?
3. `phase: "ensureAndHydrateProfile_start"` - Multiple instances?

**Diagnosis:**
- If both INITIAL_SESSION and bootstrap run → Race condition
- Check `hasHandledInitialSession` flag usage

**Fix:**
- Ensure single bootstrap execution
- Gate SIGNED_IN handler on `hasHandledInitialSession`
- Use bootstrap promise ref to prevent concurrent runs

### Issue: AbortError Noise in Sentry

**Symptoms:**
- Many AbortErrors in Sentry
- Errors from `@supabase/auth-js/locks`

**Breadcrumbs to Check:**
1. `message: "supabase_lock_abort_filtered"` - Filtered correctly?
2. `phase: "aborted"` - Expected navigation abort?

**Diagnosis:**
- AbortErrors during navigation are expected
- Should be filtered in `instrumentation-client.ts`

**Fix:**
- Verify filter in `instrumentation-client.ts:180-200`
- Check breadcrumb is added when filtering
- Ensure AbortErrors from locks are not sent to Sentry

---

## 📚 Related Documentation

### Implementation Docs
- `docs/troubleshooting/AUTH_TIMEOUT_RECOVERY_IMPLEMENTATION.md` - Timeout guard implementation
- `docs/troubleshooting/INFINITE_LOADING_DEBUG_PLAN.md` - Original debug plan
- `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` - Common auth errors

### Architecture Docs
- `docs/ARCHITECTURE_CONSTITUTION.md` - Architectural rules
- `docs/diagrams/signup-bootstrap-flow.md` - Auth bootstrap flow diagram
- `docs/diagrams/airport-model.md` - Architectural zones

### Code Files
- `components/auth/auth-provider.tsx` - Main implementation
- `instrumentation-client.ts` - Sentry configuration
- `components/auth/auth-timeout-recovery.tsx` - Recovery UI

---

## ✅ Summary

### Breadcrumb Strings

| String | Type | Purpose | Location |
|--------|------|---------|----------|
| `getUser_start` | Phase | Mark user retrieval start | auth-provider.tsx:555 |
| `getUser_error` | Phase | Capture getUser() errors | auth-provider.tsx:575 |
| `auth.bootstrap` | Category | Group all bootstrap breadcrumbs | Multiple locations |
| `INITIAL_SESSION` | Event | Initial session detection | auth-provider.tsx:682 |

### Key Insights

1. **Comprehensive Coverage:** Breadcrumbs track every critical step of auth bootstrap
2. **Error Tracking:** All errors are captured with context (phase, error message, timestamps)
3. **Timeout Detection:** Soft (8s) and hard (12s) timeouts help identify infinite loading
4. **Race Condition Handling:** AbortError tracking helps filter expected navigation aborts
5. **Production Debugging:** Sentry integration enables remote debugging of auth issues

### Best Practices

1. **Always check breadcrumbs** when debugging auth issues
2. **Use Sentry filters** to find specific phases or errors
3. **Check console logs** for local debugging (mirror Sentry breadcrumbs)
4. **Verify timeout recovery** if bootstrap hangs
5. **Filter AbortErrors** appropriately (expected during navigation)

---

**Last Updated:** February 4, 2026  
**Maintained By:** TOTL Development Team
