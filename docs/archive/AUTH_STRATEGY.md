# TOTL Agency Authentication Strategy

> Legacy strategy document (historical context).
> Canonical auth behavior now lives in `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` and `docs/tests/AUTH_BOOTSTRAP_TEST_MATRIX.md`.

**Last Updated:** October 23, 2025  
**Version:** 2.1  
**Status:** Production Ready

## ⚠️ CRITICAL: Read This First

**BEFORE making ANY changes to authentication, signup, or database triggers:**

1. ✅ **Read** `AUTH_DATABASE_TRIGGER_CHECKLIST.md` - Pre-flight checklist
2. ✅ **Verify** `database_schema_audit.md` - Schema single source of truth  
3. ✅ **Check** current `handle_new_user()` function matches schema
4. ✅ **Test** signup flow after ANY auth changes

**October 23, 2025 Production Incident:** A mismatch between the `handle_new_user()` trigger function and the actual schema caused signup failures. The function was trying to insert an `email` column that doesn't exist in the `profiles` table.

---

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [User Signup Flow](#user-signup-flow)
- [Critical Requirements](#critical-requirements)
- [Testing Scenarios](#testing-scenarios)
- [Troubleshooting](#troubleshooting)
- [Security Features](#security-features)

## 🎯 Overview

This document outlines the complete authentication and profile creation strategy for TOTL Agency. The system uses Supabase Auth with automatic profile creation via database triggers.

**Current Auth Flow (Updated):**
1. User clicks "Create Account" in navbar → redirects to `/choose-role`
2. User selects "Join as Talent" → proceeds to talent signup
3. After signup → email verification → talent dashboard redirect

**Career Builder Application Flow (Requires Approval):**
1. User creates Talent account first
2. User applies to become Career Builder via `/client/apply`
3. Application stored in `client_applications` table (status: "pending")
4. Admin reviews and approves application
5. Profile updated to `role: "client"` and `account_type: "client"`
6. User gains access to Career Builder dashboard

**Note:** Direct signup as Career Builder is not available. All Career Builder access requires approval through the application process.

**Related Documentation:**
- `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md` - **MANDATORY** pre-flight checklist
- `database_schema_audit.md` - Database schema single source of truth
- `docs/SECURITY_CONFIGURATION.md` - Security and RLS policies

## 🏗️ Architecture

### **User Signup Flow (Updated)**
```
1. User clicks "Create Account" (navbar)
   ↓
2. Redirects to /choose-role (role selection page)
   ↓
3. User selects "Join as Talent"
   ↓
4. Proceeds to talent signup form
   ↓
5. Supabase Auth creates user + trigger creates profile
   ↓
6. Email verification required
   ↓
7. Redirect to talent dashboard
```

### **Career Builder Application Flow (Requires Approval)**
```
1. User creates Talent account (via /choose-role)
   ↓
2. Email verification
   ↓
3. Talent dashboard access
   ↓
4. User applies to become Career Builder (/client/apply)
   ↓
5. Application submitted → stored in client_applications (status: "pending")
   ↓
6. Admin reviews application (/admin/client-applications)
   ↓
7. Admin approves → Profile updated (role: "client", account_type: "client")
   ↓
8. User receives approval email
   ↓
9. User gains access to Career Builder dashboard (/client/dashboard)
```

**Important:** 
- `/client/signup` redirects to `/client/apply` (no direct signup)
- Career Builder access requires admin approval
- Users must have Talent account before applying

### **Database Schema**
```
auth.users (Supabase Auth)
    ↓ (trigger)
profiles (Main user profiles)
    ↓ (1:1 relationship)
talent_profiles (Talent bootstrap)

Client promotion (Career Builder) is handled by admin approval:
profiles promoted to client + client_profiles created (no client bootstrap in trigger)
```

### **Key Tables**

#### **profiles Table**
```sql
id              UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id)
role            user_role NOT NULL DEFAULT 'talent'
account_type     account_type_enum NOT NULL DEFAULT 'unassigned'
display_name    TEXT
avatar_url      TEXT               -- Legacy profile picture URL
avatar_path     TEXT               -- Storage path for avatar
email_verified  BOOLEAN DEFAULT false
created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
```

**⚠️ CRITICAL NOTE:** There is **NO `email` column** in the `profiles` table! Email addresses are stored in `auth.users.email` only. The `handle_new_user()` trigger function must NOT try to insert an email column.

#### **talent_profiles Table**
```sql
id              UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID NOT NULL REFERENCES profiles(id)
first_name      TEXT NOT NULL DEFAULT ''
last_name       TEXT NOT NULL DEFAULT ''
phone           TEXT
age             INTEGER
location        TEXT
experience      TEXT
portfolio_url   TEXT
height          TEXT
measurements    TEXT
hair_color      TEXT
eye_color       TEXT
shoe_size       TEXT
languages       TEXT[]
created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
```

#### **client_profiles Table**
```sql
id              UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID NOT NULL REFERENCES profiles(id)
company_name    TEXT NOT NULL DEFAULT ''
industry        TEXT
website         TEXT
contact_name    TEXT
contact_email   TEXT
contact_phone   TEXT
company_size    TEXT
created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
```

## 🔄 User Signup Flow

### **1. Frontend Signup Process**

#### **Talent Signup**
```typescript
// From: components/talent-signup-form.tsx
const { error } = await signUp(data.email, data.password, {
  data: {
    first_name: data.firstName,    // ✅ lowercase with underscore
    last_name: data.lastName,      // ✅ lowercase with underscore
    role: "talent",                // ✅ lowercase
  },
  emailRedirectTo: `${window.location.origin}/auth/callback`,
});
```

#### **Career Builder Application (Not Direct Signup)**
```typescript
// Career Builder access requires approval - no direct signup
// Users must:
// 1. Create Talent account first
// 2. Apply via /client/apply page
// 3. Wait for admin approval

// Application is submitted via:
// From: app/client/apply/page.tsx
const result = await submitClientApplication({
  firstName: formData.firstName,
  lastName: formData.lastName,
  companyName: formData.companyName,
  email: formData.email,
  phone: formData.phone,
  industry: formData.industry,
  businessDescription: formData.businessDescription,
  needsDescription: formData.needsDescription,
  website: formData.website,
});

// Application stored in client_applications table (status: "pending")
// Admin approves via /admin/client-applications
// Profile updated: role: "client", account_type: "client"
```

**Note:** `/client/signup` redirects to `/client/apply` - direct Career Builder signup is not available.

### **2. Database Trigger Process**

#### **Trigger Function: `handle_new_user()`**
```sql
-- Location: supabase/migrations/20251216190000_auth_bootstrap_contract_handle_new_user.sql
-- Fires: AFTER INSERT ON auth.users

-- Auth bootstrap contract (PR #3): never trust metadata.role for privilege escalation
user_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
user_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');

-- Robust display name construction
IF user_first_name IS NOT NULL AND user_first_name <> '' AND 
   user_last_name IS NOT NULL AND user_last_name <> '' THEN
  display_name := user_first_name || ' ' || user_last_name;
ELSIF user_first_name IS NOT NULL AND user_first_name <> '' THEN
  display_name := user_first_name;
ELSIF user_last_name IS NOT NULL AND user_last_name <> '' THEN
  display_name := user_last_name;
ELSE
  display_name := split_part(new.email, '@', 1);
END IF;

-- Create profiles
INSERT INTO profiles (id, role, account_type, display_name, email_verified)
VALUES (new.id, 'talent'::user_role, 'talent'::account_type_enum, display_name, new.email_confirmed_at IS NOT NULL)
ON CONFLICT (id) DO UPDATE
SET role = 'talent'::user_role,
    account_type = 'talent'::account_type_enum;

-- Create talent profile (idempotent)
INSERT INTO talent_profiles (user_id, first_name, last_name)
VALUES (new.id, user_first_name, user_last_name)
ON CONFLICT (user_id) DO NOTHING;
```

## 🚨 Critical Requirements

### **Metadata Key Naming Convention**
**⚠️ CRITICAL:** All metadata keys must use **lowercase with underscores**:

```typescript
// ✅ CORRECT - trigger uses only snake_case name fields (role is ignored for privilege)
{
  first_name: "John",      // lowercase with underscore
  last_name: "Doe",        // lowercase with underscore
}

// ❌ WRONG - trigger won't find these keys
{
  firstName: "John",       // camelCase - trigger won't find this
  lastName: "Doe",         // camelCase - trigger won't find this
}
```

### **NOT NULL Column Protection**
All NOT NULL columns are protected with safe defaults:

| Column | Table | Default | Protection |
|--------|-------|---------|------------|
| `role` | profiles | `'talent'` | COALESCE with 'talent' default |
| `account_type` | profiles | `'unassigned'` (schema) → `'talent'` (bootstrap) | DB trigger + runtime repair enforce talent on signup |
| `first_name` | talent_profiles | `''` | COALESCE with empty string |
| `last_name` | talent_profiles | `''` | COALESCE with empty string |
| `company_name` | client_profiles | `''` | client_profiles is created only on admin approval (not at signup) |

## 🧪 Testing Scenarios

### **Edge Cases Handled**
All scenarios have been tested and work correctly:

| Scenario | Metadata | Result | Notes |
|----------|----------|--------|-------|
| Complete Talent | `{"first_name": "John", "last_name": "Doe", "role": "talent"}` | ✅ Success | Normal signup flow |
| Partial Talent | `{"role": "talent"}` | ✅ Success | Missing names default to empty strings |
| Empty Metadata | `{}` | ✅ Success | All defaults applied |
| NULL Metadata | `NULL` | ✅ Success | All defaults applied |
| OAuth User | Minimal metadata | ✅ Success | Graceful fallbacks applied |

### **Career Builder Application Scenarios**

| Scenario | Flow | Result | Notes |
|----------|------|--------|-------|
| Talent → Apply | User has Talent account → Applies via `/client/apply` | ✅ Success | Application stored, pending approval |
| Direct Signup Attempt | User visits `/client/signup` | ✅ Redirects | Redirects to `/client/apply` with message |
| Application Approval | Admin approves application | ✅ Success | Profile updated to `role: "client"` |
| Application Rejection | Admin rejects application | ✅ Success | User notified, can reapply |
| Pending Application | User checks status | ✅ Success | Shows pending status correctly |

## 🔧 Troubleshooting

### **Common Issues**

#### **"null value violates not-null constraint"**
**Cause:** Metadata keys using wrong naming convention (camelCase instead of snake_case)  
**Solution:** Ensure all metadata keys use lowercase with underscores

#### **Profile not created after signup**
**Cause:** Trigger function not firing  
**Solution:** Check if `on_auth_user_created` trigger exists on `auth.users` table

#### **Wrong role assigned**
**Cause:** Attempting to rely on `role` in auth metadata  
**Solution:** **Do not** rely on `user_metadata.role` for privilege. New signups always bootstrap as **Talent**. Career Builder (client) is granted only via **admin approval** of `client_applications`.

### **Debug Queries**
```sql
-- Check if trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check trigger function
SELECT routine_definition FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check user metadata
SELECT id, email, raw_user_meta_data FROM auth.users 
WHERE email = 'user@example.com';

-- Check profile creation
SELECT p.*, tp.first_name, tp.last_name, cp.company_name
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id
WHERE p.id = 'user-uuid';

-- Get new users without profiles (should be empty)
SELECT * FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verify role and email verification status
SELECT id, role, email_verified, display_name FROM profiles;

-- Check for users with missing role-specific profiles
SELECT p.id, p.role, p.display_name,
       CASE 
         WHEN p.role = 'talent' AND tp.user_id IS NULL THEN 'Missing talent profile'
         WHEN p.role = 'client' AND cp.user_id IS NULL THEN 'Missing client profile'
         ELSE 'Profile complete'
       END as status
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id;
```

## 🛡️ Security Features

### **Recent Security Improvements (July 25, 2025)**
- ✅ **Function search paths** secured against injection attacks
- ✅ **OTP expiry** reduced to 15 minutes (900 seconds)
- ✅ **Password requirements** enhanced to require symbols
- ✅ **RLS policies** on all tables
- ✅ **Role-based access control** enforced

### **Authentication Hardening**
- **Email verification** required for all accounts
- **Secure session management** with proper expiry
- **No service keys** exposed to client code
- **Input validation** with Zod schemas

### **Database Security**
- **Row-Level Security (RLS)** enabled on all tables
- **Proper function permissions** with minimal access
- **Schema isolation** with explicit search paths
- **Secure trigger functions** with proper error handling

## 📋 Migration History

### **Key Migrations**
1. `20250722013500_add_user_profile_creation_trigger.sql` - Created initial trigger
2. `20250722015600_fix_handle_new_user_trigger_null_handling.sql` - Fixed NULL handling
3. `20250725211607_fix_security_warnings.sql` - Security hardening

### **Applying Migrations**
```bash
# Local development
supabase db reset

# Production
supabase db push
```

## 🎯 Best Practices

### **For Frontend Developers**
1. Always use lowercase with underscores for metadata keys (names only)
2. **Do not treat `role` metadata as authoritative** — it is ignored for security; all signups bootstrap as Talent
3. Handle email verification flow properly
4. Test with incomplete metadata

### **For Backend Developers**
1. Never bypass the trigger for profile creation
2. Use RLS policies for data access
3. Always check user role before operations
4. Test edge cases with minimal metadata

### **For Database Administrators**
1. Monitor trigger performance
2. Backup trigger functions with migrations
3. Test trigger with various metadata scenarios
4. Document any schema changes

## 🔍 Query Pattern Best Practices

### **⚠️ CRITICAL: Avoid N+1 Query Issues - Use Auth Provider Profile**

**Problem:** Fetching profile data in multiple components causes N+1 query issues, making 5+ duplicate profile queries per page load.

**Solution:** Use profile data from `useAuth()` hook instead of fetching it separately. The auth provider fetches ALL profile fields once and caches them in context.

#### **✅ CORRECT: Use Profile from Auth Context**

```typescript
// ✅ CORRECT - Use profile from auth provider (no duplicate queries)
import { useAuth } from "@/components/auth/auth-provider";

function Dashboard() {
  const { user, profile } = useAuth();
  
  // Profile data is already available:
  // - profile.role
  // - profile.avatar_url
  // - profile.avatar_path
  // - profile.display_name
  
  return (
    <Avatar>
      <AvatarImage src={profile?.avatar_url || "/default.png"} />
    </Avatar>
  );
}
```

#### **❌ WRONG: Fetching Profile Separately**

```typescript
// ❌ WRONG - Causes N+1 query issue
function Dashboard() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    // This duplicates the query already done in auth provider!
    supabase
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setUserProfile(data));
  }, [user]);
}
```

#### **When to Use Auth Provider Profile vs Separate Query**

**✅ Always use auth provider profile for:**
- Avatar images (`profile.avatar_url`)
- Display names (`profile.display_name`)
- User role (`profile.role` or `userRole`)
- Any profile data needed in client components

**✅ Only query separately for:**
- Server components (initial page load/routing)
- Profile data that changes frequently and needs fresh fetch
- Admin operations viewing other users' profiles
- Role-specific profiles (talent_profiles, client_profiles)

#### **Files Updated (January 2025)**
- ✅ `components/auth/auth-provider.tsx` - Now fetches full profile (role, avatar_url, avatar_path, display_name)
- ✅ `app/talent/dashboard/page.tsx` - Uses profile from auth context
- ✅ `app/client/dashboard/page.tsx` - Uses profile from auth context
- ✅ `app/talent/[slug]/talent-profile-client.tsx` - Uses profile from auth context

**Impact:** Reduced 5+ profile queries per page load to 1 query (cached in auth context).

---

### **⚠️ CRITICAL: Use `.maybeSingle()` for Profile Queries**

**Problem:** Using `.single()` on profile queries causes 406 "Not Acceptable" errors when profiles don't exist, breaking error handling and preventing proper Sentry tracking.

**Solution:** Always use `.maybeSingle()` when querying profiles, talent_profiles, or client_profiles that might not exist.

#### **When to Use `.maybeSingle()` vs `.single()`**

**✅ Use `.maybeSingle()` for:**
- Profile queries (profiles, talent_profiles, client_profiles)
- Any query where the record might not exist
- Authentication/authorization checks
- User data that may be missing

**✅ Use `.single()` for:**
- Queries where the record MUST exist (e.g., after a successful insert)
- Internal operations where missing data indicates a bug
- Admin operations with guaranteed data

#### **Example: Correct Profile Query Pattern (Server Components Only)**

```typescript
// ✅ CORRECT - Server component query (only when not available from auth)
// Use maybeSingle() to prevent 406 errors
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role, avatar_url, avatar_path, display_name")
  .eq("id", user.id)
  .maybeSingle();

// Handle missing profile gracefully
if (!profile || profileError) {
  // Profile doesn't exist - create it or redirect
  return { error: "Profile not found" };
}

// ✅ CORRECT - Check for null data (maybeSingle returns null, not error)
if (!profile) {
  // Handle missing profile
}

// ❌ WRONG - Using .single() causes 406 errors
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single(); // This throws 406 if profile doesn't exist!
```

#### **Updated Logic Pattern**

When switching from `.single()` to `.maybeSingle()`, update your error handling:

```typescript
// ❌ OLD (with .single()) - Don't use this pattern anymore
if (profileError && profileError.code === "PGRST116") {
  // Profile doesn't exist
}

// ✅ NEW (with .maybeSingle()) - Correct pattern
// Handle actual errors first (not PGRST116 - that doesn't occur with maybeSingle())
if (profileError) {
  console.error("Error checking profile:", profileError);
  // Log to Sentry, return error, etc.
  return { error: "Failed to check existing profile" };
}

// With maybeSingle(), no rows returns null data (not an error)
if (!profile) {
  // Profile doesn't exist - create it
}
```

**Key Points:**
- PGRST116 error code only occurs with `.single()`, NOT with `.maybeSingle()`
- With `.maybeSingle()`, no rows found returns `null` data (not an error)
- Always handle actual errors first, then check `!data`
- Never check for PGRST116 when using `.maybeSingle()`

#### **Files Updated (November 2025 - January 2025)**
- ✅ `lib/actions/auth-actions.ts` - All profile queries
- ✅ `components/auth/auth-provider.tsx` - Client-side profile queries (now fetches full profile)
- ✅ `middleware.ts` - All profile queries
- ✅ `app/auth/callback/page.tsx` - Profile verification queries
- ✅ `lib/actions/client-actions.ts` - Admin profile checks
- ✅ `lib/utils/safe-query.ts` - All utility profile queries
- ✅ `app/onboarding/page.tsx` - Profile fetch (server component - OK)
- ✅ `app/dashboard/page.tsx` - Profile fetch (server component - OK)
- ✅ `app/talent/dashboard/page.tsx` - Now uses auth provider profile
- ✅ `app/client/dashboard/page.tsx` - Now uses auth provider profile
- ✅ `app/talent/[slug]/talent-profile-client.tsx` - Now uses auth provider profile

**See:** `docs/SENTRY_ERROR_TRACKING_ENHANCEMENT.md` for complete details on the 406 error fix.

## 🚀 Performance Optimizations (January 2025)

### **N+1 Query Prevention**

**Issue:** Multiple components were fetching the same profile data, causing 5+ duplicate queries per page load.

**Solution:** Extended auth provider to fetch and cache full profile data, eliminating duplicate queries.

#### **Auth Provider Profile Caching**

The `useAuth()` hook now provides full profile data:

```typescript
const { user, profile, userRole } = useAuth();

// Available profile fields:
// - profile.role
// - profile.avatar_url
// - profile.avatar_path
// - profile.display_name
```

**Benefits:**
- ✅ Single profile query per session (cached in context)
- ✅ No duplicate queries across components
- ✅ Faster page loads
- ✅ Reduced database load

**Before Fix:** 5+ profile queries per dashboard page load  
**After Fix:** 1 profile query (cached in auth context)

**Files Fixed:**
- ✅ `components/auth/auth-provider.tsx` - Fetches full profile once
- ✅ `app/talent/dashboard/page.tsx` - Uses cached profile
- ✅ `app/client/dashboard/page.tsx` - Uses cached profile
- ✅ `app/talent/[slug]/talent-profile-client.tsx` - Uses cached profile

**See:** `docs/SUPABASE_PERFORMANCE_FIX_GUIDE.md` for database-level performance optimizations.

---

## 🔗 Related Documentation
- [Database Schema Audit](../database_schema_audit.md)
- [Developer Quick Reference](./DEVELOPER_QUICK_REFERENCE.md)
- [Coding Standards](./CODING_STANDARDS.md)
- [Security Fixes Summary](../SECURITY_FIXES_SUMMARY.md)
- [Supabase Performance Fix Guide](./SUPABASE_PERFORMANCE_FIX_GUIDE.md) - Database performance optimizations

---

**Maintainer:** TOTL Agency Development Team  
**Last Review:** January 2025  
**Next Review:** February 2025 