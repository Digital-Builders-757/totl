# Supabase API Key Missing Fix

**Date:** January 20, 2025  
**Status:** ✅ IMPLEMENTED  
**Issue:** Production bug where browser requests to `/gigs/[id]/apply` fail with "No API key found in request" from Supabase REST API.

---

## Root Cause

The browser Supabase client (`createSupabaseBrowser()`) was returning `null` silently when environment variables were missing, allowing code to proceed and make requests without the required `apikey` header. 

**Critical:** `NEXT_PUBLIC_*` environment variables are **inlined at build time**, not runtime. If these vars were missing when Vercel built the production bundle, the deployed JS literally contains `undefined` - even if Vercel shows the vars now. This requires a **redeploy with cache cleared** to fix.

Additionally, the code was using `createBrowserClient` from `@supabase/ssr` with custom cookie handling, which added unnecessary complexity and potential edge cases. For pure browser components, plain `createClient` is simpler and more reliable.

---

## Changes Implemented

### 1. Hard Failure in Production + Simplified Client (`lib/supabase/supabase-browser.ts`)

**Before:**
- Returned `null` if env vars missing (silent failure)
- Used `createBrowserClient` from `@supabase/ssr` with custom cookie handling
- Custom cookie implementation with edge cases

**After:**
- **Production**: Throws immediately if env vars missing (fail fast, no silent breakage)
- **Development**: Returns `null` for testing scenarios (graceful degradation)
- **Switched to `createClient`** (simpler, more reliable for browser-only components)
- Auth session persistence handled automatically via localStorage
- Added initialization logging (dev only)
- Error message explicitly mentions redeploying with cache cleared

```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Check Vercel Production environment variables and redeploy if needed.";

  if (process.env.NODE_ENV === "production") {
    throw new Error(errorMessage);
  }
  
  console.warn("[Supabase Client] Development warning:", errorMessage);
  return null;
}
```

### 2. Enhanced Error Handling (`lib/hooks/use-supabase.ts`)

**Before:**
- Silently returned `null` if client creation failed
- No distinction between production/development behavior

**After:**
- Re-throws errors in production (fail loud)
- Returns `null` in development (for testing)
- Enhanced error logging

### 3. Hard Guards in Form Component (`app/gigs/[id]/apply/apply-to-gig-form.tsx`)

**Before:**
- Checked for `null` client but error message was generic
- No specific handling for missing API key errors

**After:**
- Hard guard prevents any Supabase calls if client is `null`
- Specific error message for missing API key errors
- Enhanced logging for production debugging
- Clear user-facing error messages

**Key Guards Added:**
```typescript
// Guard 1: Before any Supabase calls
if (!supabase) {
  // Fail immediately with clear error
  return;
}

// Guard 2: Before query (double-check)
if (!supabase) {
  setError("Session expired. Please refresh the page.");
  return;
}

// Guard 3: Query error handling
if (queryError?.message?.includes("No API key found")) {
  setError("Configuration error: Database connection failed...");
  return;
}
```

---

## Verification Checklist

### Step 0: Verify Vercel Environment Variables + Redeploy

**In Vercel Dashboard:**
1. Go to Project → Settings → Environment Variables
2. Check **Production** environment (not Preview/Development)
3. Verify both exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **CRITICAL: Redeploy with cache cleared**
   - Go to Deployments → Click "Redeploy" on latest production deployment
   - **Uncheck "Use existing Build Cache"** (or select "Redeploy with existing Build Cache" OFF)
   - This forces a fresh build that inlines the current env vars
   - Without clearing cache, old bundle with `undefined` values may persist

### Step 1: Test in Production

1. **Navigate to** `/gigs/[id]/apply` as a talent user with active subscription
2. **Open DevTools** → Network tab → Filter by "applications"
3. **Check Request Headers**:
   - ✅ `apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>` header present
   - ✅ `Authorization: Bearer <session_token>` header present
4. **Check Initiator Column**:
   - Should point to `apply-to-gig-form.tsx` or Supabase client code
   - Not a direct `fetch()` call

### Step 2: Verify Error Handling

**Test Missing Env Vars (Development):**
1. Remove `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`
2. Restart dev server
3. Navigate to `/gigs/[id]/apply`
4. **Expected**: Clear error message, no crash

**Test Missing Env Vars (Production Build):**
1. Remove env vars from Vercel Production
2. Redeploy
3. Navigate to `/gigs/[id]/apply`
4. **Expected**: App throws error immediately (no silent failure)

### Step 3: Monitor Sentry

**Look for:**
- ✅ Clear error messages if env vars missing (no more "No API key found" without context)
- ✅ Error breadcrumbs showing client initialization failure
- ✅ Reduced "mysterious spinner" errors

---

## Network Tab Debugging

If you still see "No API key found" errors:

1. **Open Chrome DevTools** → Network tab
2. **Filter by** `rest/v1/applications`
3. **Click the failing request**
4. **Check Headers tab**:
   - Missing `apikey` header → Env var issue (check Vercel + redeploy)
   - Missing `Authorization` header → Session issue (check auth flow)
5. **Check Initiator column**:
   - Points to `apply-to-gig-form.tsx` → Our guards should prevent this
   - Points to unknown/blank → Possible stale client instance

---

## Files Changed

1. ✅ `lib/supabase/supabase-browser.ts` - Hard failure in production
2. ✅ `lib/hooks/use-supabase.ts` - Enhanced error handling
3. ✅ `app/gigs/[id]/apply/apply-to-gig-form.tsx` - Hard guards + error messages
4. ✅ `docs/archive/DEBUG_MISSING_API_KEY_PLAN_JAN_2025.md` - Updated with implementation details

---

## Expected Behavior After Fix

### Production (Env Vars Present):
- ✅ Client initializes successfully
- ✅ All requests include `apikey` header
- ✅ Form works correctly
- ✅ No "No API key found" errors

### Production (Env Vars Missing):
- ❌ App throws error immediately on page load
- ❌ Clear error message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
- ❌ No silent failures, no ghost requests

### Development (Env Vars Missing):
- ⚠️ Client returns `null`
- ⚠️ Form shows clear error message
- ⚠️ No crash, allows testing scenarios

---

## Related Documentation

- `docs/ENV_SETUP_GUIDE.md` - Environment variable setup
- `docs/ENV_VARIABLES_COMPLETE_LIST.md` - Complete env var reference
- `docs/TROUBLESHOOTING_GUIDE.md` - Common issues and solutions

---

## Notes

- **Build-time vs Runtime**: `NEXT_PUBLIC_*` env vars are **inlined at build time**, not runtime. If missing during build, bundle contains `undefined` until redeploy with cache cleared.
- **Simplified Client**: Switched from `createBrowserClient` (SSR cookie bridging) to `createClient` (simpler, browser-only). SSR patterns still used for server-side (`createServerClient` in middleware/server components).
- **Auth Persistence**: `createClient` handles session persistence automatically via localStorage - no custom cookie handling needed.
- **Singleton Pattern**: Client is cached as singleton. If env vars change, need to call `resetSupabaseBrowserClient()` or refresh page.
