# Three Truths Testing Guide

**Purpose:** Test the three truths logging implementation using Playwright

---

## Prerequisites

1. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

2. **Set environment variable for middleware logging:**
   ```bash
   # In .env.local or terminal
   DEBUG_ROUTING=1
   ```

3. **Ensure test database is set up** (if using separate test DB)

---

## Running the Tests

### Option 1: Run with Playwright Test Runner

```bash
npx playwright test tests/auth/three-truths-logging.spec.ts
```

### Option 2: Run with UI Mode (Interactive)

```bash
npx playwright test tests/auth/three-truths-logging.spec.ts --ui
```

### Option 3: Run Specific Test

```bash
npx playwright test tests/auth/three-truths-logging.spec.ts -g "Verify three truths logging during login"
```

---

## Test Suite Overview

### Test 1: "Verify three truths logging during login"

**What it tests:**
- ✅ TRUTH #1: SIGNED_IN event fires
- ✅ TRUTH #2: Cookies exist in browser
- ✅ TRUTH #3: Verifies cookies are set (middleware check requires server logs)

**Expected Output:**
```
[TEST] Three Truths Verification:
✅ TRUTH #1: SIGNED_IN fires - PASS
✅ TRUTH #2: Cookies exist in browser - PASS
✅ TRUTH #3: Middleware receives cookies - Check server logs with DEBUG_ROUTING=1
```

---

### Test 2: "Verify redirect happens after three truths"

**What it tests:**
- Redirect happens quickly (< 2 seconds)
- User lands on dashboard (not stuck on login)

**Expected Output:**
```
[TEST] Redirect happened in XXXms (expected < 2000ms)
```

---

### Test 3: "Verify no redirect loops with three truths"

**What it tests:**
- No infinite redirect loops
- URL history shows clean redirect path

**Expected Output:**
```
[TEST] No redirect loops detected
[TEST] URL history: ["http://localhost:3000/login", "http://localhost:3000/talent/dashboard"]
```

---

### Test 4: "Verify cookies persist after redirect"

**What it tests:**
- Cookies exist after redirect
- Cookies are httpOnly (security check)

**Expected Output:**
```
[TEST] Cookies after redirect: ["sb-project-ref-auth-token", ...]
[TEST] HttpOnly cookies: ["sb-project-ref-auth-token", ...]
```

---

## Manual Testing Checklist

### Browser Console (After Login)

1. Open DevTools → Console
2. Login with test credentials
3. Look for these logs:

```
[auth.signIn] signInWithPassword result {
  hasError: false,
  error: null,
  hasSession: true,
  userId: "abc-123-def-456"
}

[auth.signIn] document.cookie sb* ["sb-project-ref-auth-token=..."]

[auth.onAuthStateChange] {
  event: "SIGNED_IN",
  hasSession: true,
  userId: "abc-123-def-456",
  pathname: "/login",
  cookieSb: true
}
```

**✅ Success:** All three logs appear, `cookieSb: true`, cookies array shows `sb-*` cookies

---

### Server Console (With DEBUG_ROUTING=1)

1. Check server terminal/logs
2. Look for these logs after login:

```
[totl][middleware] cookie names {
  path: "/talent/dashboard",
  cookies: ["sb-project-ref-auth-token", "sb-project-ref-auth-token.0", ...],
  hasSb: true
}

[totl][middleware] auth.getUser() {
  path: "/talent/dashboard",
  userId: "abc-123-def-456",
  email: "user@example.com"
}
```

**✅ Success:** `hasSb: true`, cookies array contains `sb-*` cookies, `getUser()` returns userId

---

## Troubleshooting

### Issue: SIGNED_IN event doesn't fire

**Symptoms:**
- No `[auth.onAuthStateChange] event: "SIGNED_IN"` log
- User stuck on login page

**Check:**
- Verify Supabase client is initialized
- Check browser console for errors
- Verify event listener is registered

---

### Issue: Cookies don't exist in browser

**Symptoms:**
- `cookieSb: false` in logs
- Empty cookie array

**Check:**
- Verify browser client uses `createBrowserClient` (not `createClient`)
- Check DevTools → Application → Cookies
- Verify cookie domain matches site domain

---

### Issue: Middleware doesn't receive cookies

**Symptoms:**
- `hasSb: false` in middleware logs
- Empty cookies array
- `getUser()` returns null

**Check:**
- Verify `DEBUG_ROUTING=1` is set
- Check cookie domain/path in browser DevTools
- Verify `redirectWithCookies()` is used for all redirects

---

## Expected Test Results

### All Tests Pass ✅

```
Running 4 tests using 1 worker

  ✓ tests/auth/three-truths-logging.spec.ts:18:5 › Three Truths Logging › Verify three truths logging during login (15.2s)
  ✓ tests/auth/three-truths-logging.spec.ts:95:1 › Three Truths Logging › Verify redirect happens after three truths (8.5s)
  ✓ tests/auth/three-truths-logging.spec.ts:130:1 › Three Truths Logging › Verify no redirect loops with three truths (10.1s)
  ✓ tests/auth/three-truths-logging.spec.ts:175:1 › Three Truths Logging › Verify cookies persist after redirect (9.8s)

  4 passed (43.6s)
```

---

## Next Steps

1. **Run the test suite** to verify all three truths
2. **Check browser console** during manual login
3. **Check server logs** (with DEBUG_ROUTING=1) to verify middleware receives cookies
4. **If all three truths pass:** Redirect should work, no loops
5. **If any truth fails:** Use logs to identify the issue

---

## Files

- **Test file:** `tests/auth/three-truths-logging.spec.ts`
- **Implementation:** `components/auth/auth-provider.tsx`, `middleware.ts`
- **Documentation:** `docs/AUTH_THREE_TRUTHS_LOGGING_IMPLEMENTATION.md`
