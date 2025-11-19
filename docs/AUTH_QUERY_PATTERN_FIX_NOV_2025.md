# Authentication Query Pattern Fix - November 2025

**Date:** November 17, 2025  
**Status:** ✅ Complete - All profile queries updated to use `.maybeSingle()`

---

## 🎯 Overview

Fixed critical 406 "Not Acceptable" errors throughout the authentication flow by replacing `.single()` with `.maybeSingle()` for all profile-related queries. This ensures graceful error handling when profiles don't exist and prevents redirect loops.

---

## 🐛 Problem

### **Root Cause**
PostgREST (Supabase's API layer) returns a 406 "Not Acceptable" error when:
- `.single()` is used and zero rows are returned (expected exactly one)
- `.single()` is used and multiple rows are returned (expected exactly one)

This is different from a 404 - it's a "Not Acceptable" response that breaks error handling flows.

### **Impact**
- Profile queries failed with 406 errors when profiles didn't exist
- Error handling logic broke (checking for `PGRST116` error code didn't work)
- Sentry error tracking was disrupted
- Redirect loops occurred in authentication flow
- User experience degraded with unexpected errors

---

## ✅ Solution

### **Pattern Change**
Replaced all `.single()` calls with `.maybeSingle()` for profile-related queries.

**Key Difference:**
- `.single()`: Throws 406 error when no rows found
- `.maybeSingle()`: Returns `null` data (no error) when no rows found

### **Updated Error Handling**
When switching from `.single()` to `.maybeSingle()`, error handling must be updated:

```typescript
// OLD (with .single())
if (profileError && profileError.code === "PGRST116") {
  // Profile doesn't exist
}

// NEW (with .maybeSingle())
// With maybeSingle(), no rows returns null data (not an error)
if (!profile || (profileError && profileError.code === "PGRST116")) {
  // Profile doesn't exist
}
```

---

## 📋 Files Updated

### **Core Authentication Files**

1. **`lib/actions/auth-actions.ts`** ✅
   - `ensureProfileExists()` - Line 30: Changed to `.maybeSingle()`
   - `ensureProfilesAfterSignup()` - Line 222: Changed to `.maybeSingle()`
   - `ensureProfilesAfterSignup()` - Line 245: Talent profile check changed to `.maybeSingle()`
   - `ensureProfilesAfterSignup()` - Line 287: Talent profile check for existing profile changed to `.maybeSingle()`
   - `handleLoginRedirect()` - Line 455: Client profile verification changed to `.maybeSingle()`
   - `handleLoginRedirect()` - Line 495: Metadata-based role verification changed to `.maybeSingle()`
   - Updated logic to check `!profile` in addition to error codes

2. **`components/auth/auth-provider.tsx`** ✅
   - `signIn()` function - Line 278: Profile query changed to `.maybeSingle()`
   - Already using `.maybeSingle()` in `initialSession()` and `onAuthStateChange()` (lines 119, 178)

3. **`middleware.ts`** ✅
   - All profile queries already using `.maybeSingle()` (lines 103, 158, 198, 214, 255, 281, 310, 327, 345, 351)

4. **`app/auth/callback/page.tsx`** ✅
   - Line 107: Initial profile check changed to `.maybeSingle()`
   - Line 187: Profile re-fetch after creation changed to `.maybeSingle()`
   - Updated logic to check `!profile` in addition to error codes

### **Action Files**

5. **`lib/actions/client-actions.ts`** ✅
   - Line 131: Admin profile check changed to `.maybeSingle()`
   - Line 214: Admin profile check changed to `.maybeSingle()`
   - Line 143: Application query changed to `.maybeSingle()`
   - Line 227: Application query changed to `.maybeSingle()`

### **Utility Files**

6. **`lib/utils/safe-query.ts`** ✅
   - `getProfileByUserId()` - Line 89: Changed to `.maybeSingle()`
   - `getTalentProfileByUserId()` - Line 113: Changed to `.maybeSingle()`
   - `getClientProfileByUserId()` - Line 134: Changed to `.maybeSingle()`
   - Added documentation comments about using `.maybeSingle()`

### **Page Files**

7. **`app/onboarding/page.tsx`** ✅
   - Line 13: Profile query changed to `.maybeSingle()`

8. **`app/dashboard/page.tsx`** ✅
   - Line 11: Profile query changed to `.maybeSingle()`

---

## 📊 Summary Statistics

- **Total Files Updated:** 8 files
- **Total Instances Fixed:** 15+ instances
- **Files Already Correct:** 1 file (middleware.ts was already using `.maybeSingle()`)
- **Zero Linting Errors:** All changes pass linting

---

## 🧪 Testing Checklist

### **Authentication Flow**
- [x] Signup flow works correctly
- [x] Login redirect works correctly
- [x] Profile creation after signup works
- [x] Role-based redirects work correctly
- [x] Missing profile handling works gracefully

### **Error Handling**
- [x] No 406 errors in Sentry
- [x] Error tracking works correctly
- [x] Missing profiles handled gracefully
- [x] Redirect loops prevented

### **Edge Cases**
- [x] User with no profile (new signup)
- [x] User with missing role
- [x] User with missing talent/client profile
- [x] OAuth callback with missing profile
- [x] Admin operations with profile checks

---

## 📚 Documentation Updates

### **Updated Files**
1. **`docs/AUTH_STRATEGY.md`** ✅
   - Added "Query Pattern Best Practices" section
   - Documented when to use `.maybeSingle()` vs `.single()`
   - Added code examples and migration patterns
   - Listed all updated files

2. **`docs/CODING_STANDARDS.md`** ✅
   - Added "Query Pattern Guidelines" section
   - Documented critical rules for profile queries
   - Added examples and best practices

### **Related Documentation**
- `docs/SENTRY_ERROR_TRACKING_ENHANCEMENT.md` - Original 406 error fix documentation
- `docs/AUTH_STRATEGY.md` - Complete authentication strategy
- `docs/CODING_STANDARDS.md` - General coding standards

---

## 🎯 Best Practices Going Forward

### **For Profile Queries**
1. **Always use `.maybeSingle()`** for profile, talent_profile, and client_profile queries
2. **Check for `!profile`** in addition to error codes
3. **Handle missing profiles gracefully** - create them or redirect appropriately
4. **Log errors to Sentry** for debugging (except PGRST116 which is expected)

### **For Other Queries**
1. **Use `.single()`** only when the record MUST exist
2. **Use `.maybeSingle()`** when the record might not exist
3. **Always handle null data** when using `.maybeSingle()`

### **Code Review Checklist**
- [ ] Profile queries use `.maybeSingle()`
- [ ] Error handling checks `!profile` in addition to errors
- [ ] Missing profile cases are handled gracefully
- [ ] No 406 errors in error logs

---

## 🔍 Verification

### **How to Verify Fixes**
1. Check Sentry for 406 errors - should be zero
2. Test signup flow with new users
3. Test login with users missing profiles
4. Test OAuth callback flow
5. Monitor error logs for profile-related errors

### **Monitoring**
- Sentry error tracking for 406 errors
- Authentication flow success rates
- Profile creation success rates
- Redirect loop detection

---

## 🚀 Impact

### **Before Fix**
- ❌ 406 errors breaking authentication flow
- ❌ Error handling logic broken
- ❌ Sentry tracking disrupted
- ❌ Redirect loops in auth flow
- ❌ Poor user experience

### **After Fix**
- ✅ Graceful error handling
- ✅ Proper error tracking
- ✅ No redirect loops
- ✅ Better user experience
- ✅ Consistent query patterns

---

## 📝 Related Issues

- **PR #75** - Bugbot identified multiple instances of `.single()` usage
- **Original Fix** - `docs/SENTRY_ERROR_TRACKING_ENHANCEMENT.md` (January 2025)
- **Follow-up** - Comprehensive audit and fix (November 2025)

---

## 🔗 Related Documentation

- [`docs/AUTH_STRATEGY.md`](./AUTH_STRATEGY.md) - Complete authentication strategy
- [`docs/CODING_STANDARDS.md`](./CODING_STANDARDS.md) - Coding standards with query patterns
- [`docs/SENTRY_ERROR_TRACKING_ENHANCEMENT.md`](./SENTRY_ERROR_TRACKING_ENHANCEMENT.md) - Original 406 error fix

---

**Maintainer:** TOTL Agency Development Team  
**Last Updated:** November 17, 2025  
**Status:** ✅ Complete - All fixes applied and documented

