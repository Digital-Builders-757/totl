# Auth Redirect & Profile Creation Fix - November 2025

## 🐛 Root Causes Identified

### 1. **Stale Cookies/Cached Auth State**
- **Problem**: After email verification, when users logged in from a normal browser window (not incognito), the browser had stale cookies or cached session data that didn't reflect the new verified state.
- **Impact**: App failed to immediately recognize verified/logged-in talent, requiring incognito window to work correctly.

### 2. **Client-Side Redirect After Login**
- **Problem**: Login page used `router.push()` (client-side navigation) which didn't properly refresh session cookies or force a fresh session read.
- **Impact**: Redirect happened before session cookies were fully updated, causing middleware to see stale/unauthenticated state.

### 3. **Missing Profile Auto-Creation/Update**
- **Problem**: Auth callback page checked if profile existed but didn't create/update it if missing. Database trigger should handle this, but if it fails or metadata isn't set, profile might exist without proper `display_name`.
- **Impact**: Users saw "update your name" message even though name should be auto-populated from signup form.

### 4. **No Force-Dynamic on Login Page**
- **Problem**: Login page could be statically cached, preventing fresh session reads on every request.
- **Impact**: Cached login page might show stale auth state.

### 5. **Race Condition in Auth Provider**
- **Problem**: AuthProvider's `onAuthStateChange` listener redirected based on role, but this happened asynchronously and could race with page navigation.
- **Impact**: Redirect timing issues, especially on first login after verification.

## ✅ Fixes Applied

### 1. **Created Server Action for Profile Management** (`lib/actions/auth-actions.ts`)
- **`ensureProfileExists()`**: Ensures profile exists and has proper `display_name` from user metadata
- **`handleLoginRedirect()`**: Server-side login redirect that ensures profile exists before redirecting
- **Benefits**: 
  - Runs on server (no stale cookies)
  - Guarantees profile exists with proper name
  - Uses server-side redirect (Next.js `redirect()`) which forces fresh session read

### 2. **Updated Login Page** (`app/login/page.tsx`)
- **Before**: Used client-side `router.push()` after login
- **After**: Calls `handleLoginRedirect()` server action which:
  - Ensures profile exists/updated
  - Uses server-side `redirect()` for guaranteed fresh session
  - Falls back to hard refresh (`window.location.href`) if server redirect fails
- **Added**: `force-dynamic` layout to prevent static caching

### 3. **Enhanced Auth Callback** (`app/auth/callback/page.tsx`)
- **Before**: Only checked if profile existed, showed error if missing
- **After**: 
  - Creates profile if missing (with name from user metadata)
  - Updates `display_name` if missing/empty
  - Creates `talent_profiles` row if role is talent
  - Updates email verification status
  - Redirects based on role

### 4. **Added Force-Dynamic to Login Page** (`app/login/layout.tsx`)
- **New file**: Created layout with `export const dynamic = "force-dynamic"`
- **Benefit**: Prevents static caching, ensures fresh session reads

### 5. **Improved Middleware** (`middleware.ts`)
- **Enhanced**: Better handling of missing profiles (redirects to choose-role instead of failing)
- **Note**: Middleware can't create profiles (RLS restrictions), but now handles missing profile case gracefully

## 📋 Code Changes Summary

### New Files
1. **`lib/actions/auth-actions.ts`** - Server actions for profile management and login redirect
2. **`app/login/layout.tsx`** - Force dynamic rendering for login page

### Modified Files
1. **`app/login/page.tsx`** - Uses server-side redirect instead of client-side
2. **`app/auth/callback/page.tsx`** - Auto-creates/updates profile with name
3. **`middleware.ts`** - Better handling of missing profiles

## 🧪 Test Plan

### Test 1: New Talent Signup → Verification → Login
**Steps:**
1. Open browser in normal window (not incognito)
2. Navigate to `/talent/signup`
3. Fill out signup form with:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: `test-talent-${Date.now()}@example.com`
   - Password: `Test1234!`
4. Submit form
5. Check email for verification link
6. Click verification link (should land on `/auth/callback`)
7. After callback redirects, manually navigate to `/login`
8. Log in with the credentials

**Expected Results:**
- ✅ User is immediately recognized as logged in (no stale cookie issues)
- ✅ User is automatically redirected to `/talent/dashboard`
- ✅ Profile exists in database with `display_name = "John Doe"`
- ✅ No "update your name" message appears
- ✅ Works in normal browser window (no incognito needed)

### Test 2: Returning Talent Login
**Steps:**
1. Log in as existing talent user
2. Verify redirect to `/talent/dashboard`
3. Log out
4. Log in again

**Expected Results:**
- ✅ Still lands on `/talent/dashboard` reliably
- ✅ No redirect issues

### Test 3: Client/Admin Not Broken
**Steps:**
1. Log in as client user
2. Verify redirect to `/client/dashboard`
3. Log in as admin user
4. Verify redirect to `/admin/dashboard`

**Expected Results:**
- ✅ Clients still redirect to client dashboard
- ✅ Admins still redirect to admin dashboard
- ✅ No regressions

### Test 4: Profile Name Auto-Population
**Steps:**
1. Create new talent account with first/last name
2. Verify email
3. Log in
4. Check database: `SELECT display_name FROM profiles WHERE id = '<user_id>'`
5. Check talent_profiles: `SELECT first_name, last_name FROM talent_profiles WHERE user_id = '<user_id>'`

**Expected Results:**
- ✅ `profiles.display_name` = "First Last" (from signup form)
- ✅ `talent_profiles.first_name` = "First" (from signup form)
- ✅ `talent_profiles.last_name` = "Last" (from signup form)
- ✅ No manual update required

## 🔍 How It Works Now

### Signup Flow
1. User fills signup form → `TalentSignupForm` calls `signUp()` with metadata:
   ```typescript
   {
     data: {
       first_name: "John",
       last_name: "Doe",
       role: "talent"
     }
   }
   ```
2. Supabase creates `auth.users` row
3. Database trigger `handle_new_user()` fires:
   - Creates `profiles` row with `display_name = "John Doe"`
   - Creates `talent_profiles` row with `first_name = "John"`, `last_name = "Doe"`
4. User receives verification email

### Verification Flow
1. User clicks verification link → lands on `/auth/callback`
2. `AuthCallbackPage`:
   - Exchanges code for session
   - **NEW**: Checks if profile exists, creates if missing
   - **NEW**: Updates `display_name` if missing/empty
   - Updates `email_verified = true`
   - Redirects to appropriate dashboard based on role

### Login Flow (Post-Verification)
1. User navigates to `/login` and submits credentials
2. `Login` component calls `signIn()` (client-side)
3. **NEW**: After successful sign-in, calls `handleLoginRedirect()` server action:
   - Ensures profile exists (creates if missing)
   - Updates `display_name` if missing
   - Uses server-side `redirect()` to appropriate dashboard
4. Middleware intercepts and verifies session
5. User lands on correct dashboard

### Key Improvements
- **Server-side redirects**: Use Next.js `redirect()` which forces fresh session read
- **Profile auto-creation**: Multiple fallback points ensure profile exists
- **Name auto-population**: Name is extracted from user metadata at multiple points
- **Force-dynamic**: Login page and dashboards use `force-dynamic` to prevent caching
- **Graceful fallbacks**: If server redirect fails, falls back to hard refresh

## 🎯 Expected Behavior After Fix

### New Talent After Verification & Login
1. ✅ Immediately recognized as logged in (no stale cookies)
2. ✅ Automatically redirected to `/talent/dashboard`
3. ✅ Profile exists with proper `display_name`
4. ✅ No "update your name" friction
5. ✅ Works in normal browser (no incognito needed)

### Returning Users
1. ✅ Reliable redirect to correct dashboard
2. ✅ No caching issues
3. ✅ Fresh session reads on every request

## 📝 Notes

- All dashboard pages already have `export const dynamic = "force-dynamic"` ✅
- Database trigger should create profiles, but we have multiple fallback points
- Server actions run on server, so they always have fresh session data
- Middleware can't create profiles (RLS), but redirects gracefully to choose-role


