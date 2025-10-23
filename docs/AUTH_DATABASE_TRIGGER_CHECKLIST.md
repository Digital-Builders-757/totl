# Authentication & Database Trigger Pre-Flight Checklist

**Last Updated:** October 23, 2025  
**Purpose:** Prevent authentication and database trigger errors  
**Status:** Critical Reference Document

---

## 🚨 Critical Incident Report

### **October 23, 2025 - Production Signup Failure**

**Error:** `ERROR: column "email" of relation "profiles" does not exist (SQLSTATE 42703)`

**Root Cause:** The `handle_new_user()` database trigger function was trying to insert into a non-existent `email` column in the `profiles` table. This happened because:
1. Multiple migration files had conflicting versions of the function
2. An old migration was trying to insert: `INSERT INTO profiles (id, email, role, ...)`
3. The actual schema didn't have an `email` column

**Impact:** Users could not create new accounts

**Resolution:** Updated `handle_new_user()` function to match actual schema

---

## ✅ MANDATORY PRE-FLIGHT CHECKLIST

**BEFORE making ANY changes to authentication, signup, or user profile code, you MUST:**

### **1. Verify Database Schema Truth**

```powershell
# Read the SINGLE SOURCE OF TRUTH
Get-Content database_schema_audit.md | Select-String -Pattern "profiles" -Context 20
```

**Check these exact columns exist:**

#### **profiles table:**
- ✅ `id` (uuid, NOT NULL)
- ✅ `role` (user_role, NOT NULL, DEFAULT 'talent')
- ✅ `display_name` (text)
- ✅ `avatar_url` (text)
- ✅ `avatar_path` (text)
- ✅ `email_verified` (boolean, DEFAULT false)
- ✅ `created_at` (timestamp)
- ✅ `updated_at` (timestamp)
- ❌ **NO `email` column** (email lives in `auth.users` only)

#### **talent_profiles table:**
- ✅ `id` (uuid, primary key)
- ✅ `user_id` (uuid, NOT NULL, references profiles)
- ✅ `first_name` (text, NOT NULL, DEFAULT '')
- ✅ `last_name` (text, NOT NULL, DEFAULT '')
- ✅ `phone`, `age`, `location`, `experience`, etc. (all nullable)

#### **client_profiles table:**
- ✅ `id` (uuid, primary key)
- ✅ `user_id` (uuid, NOT NULL, references profiles)
- ✅ `company_name` (text, NOT NULL, DEFAULT '')
- ✅ `industry`, `website`, `contact_name`, etc. (all nullable)

---

### **2. Verify Current Trigger Function**

**Check the actual production function:**
```sql
-- Run this in Supabase SQL Editor
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
WHERE p.proname = 'handle_new_user';
```

**The function MUST insert these exact columns:**

```sql
-- CORRECT VERSION (as of Oct 23, 2025)
INSERT INTO public.profiles (id, role, display_name, email_verified)
VALUES (new.id, user_role::user_role, display_name, new.email_confirmed_at IS NOT NULL);

-- For talent:
INSERT INTO public.talent_profiles (user_id, first_name, last_name)
VALUES (new.id, user_first_name, user_last_name);

-- For client:
INSERT INTO public.client_profiles (user_id, company_name)
VALUES (new.id, COALESCE(new.raw_user_meta_data->>'company_name', display_name));
```

**❌ WRONG - Will cause production failure:**
```sql
-- DO NOT USE THIS (old version with non-existent email column)
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
VALUES (NEW.id, NEW.email, ...);
```

---

### **3. Check Migration File Conflicts**

**Problem:** Multiple migration files can have different versions of the same function.

**Solution:** Before creating auth-related migrations:

```powershell
# Search all migration files for handle_new_user
Select-String -Path "supabase/migrations/*.sql" -Pattern "handle_new_user" -Context 3
```

**Look for:**
- ❌ Any references to `profiles.email` column
- ❌ Conflicting function definitions
- ✅ Only the latest correct version should be in production

---

### **4. Verify Auth Provider Configuration**

**Files to check:**
```
components/auth/auth-provider.tsx  (CORRECT - use this one)
components/auth-provider.tsx       (WRONG - should NOT exist, was deleted)
```

**Check import paths:**
```typescript
// ✅ CORRECT
import { useAuth } from "@/components/auth/auth-provider";

// ❌ WRONG
import { useAuth } from "./auth-provider";
import { useAuth } from "@/components/auth-provider";
```

---

### **5. Test Signup Flow End-to-End**

**Before deploying auth changes, test:**

1. **Talent Signup:**
   ```
   - Email: test-talent@example.com
   - Password: TestPass123!
   - First Name: Test
   - Last Name: Talent
   - Role: talent
   ```

2. **Client Signup:**
   ```
   - Email: test-client@example.com
   - Password: TestPass123!
   - Company: Test Company
   - Role: client
   ```

3. **Verify in Database:**
   ```sql
   -- Check profiles created
   SELECT * FROM profiles WHERE id = 'user-id';
   
   -- Check role-specific profile created
   SELECT * FROM talent_profiles WHERE user_id = 'user-id';
   SELECT * FROM client_profiles WHERE user_id = 'user-id';
   ```

---

### **6. Check Supabase Auth Configuration**

**Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (server-side only)
```

**Auth Settings in Supabase Dashboard:**
- ✅ Email confirmations enabled
- ✅ Auto-confirm email: OFF (require verification)
- ✅ Email templates configured
- ✅ Site URL and redirect URLs set correctly

---

## 🛠️ Common Auth Issues & Solutions

### **Issue 1: "Column does not exist" Error**
**Cause:** Database trigger function using outdated schema  
**Fix:** Run emergency fix SQL (see `EMERGENCY_FIX_SIGNUP.sql`)

### **Issue 2: "Cannot find variable: useAuth"**
**Cause:** Duplicate auth provider files or wrong import path  
**Fix:** Delete old `components/auth-provider.tsx`, use `components/auth/auth-provider.tsx`

### **Issue 3: Profile not created after signup**
**Cause:** Trigger not firing or RLS blocking insert  
**Fix:** 
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### **Issue 4: Migration conflicts**
**Cause:** Multiple migrations modifying same function  
**Fix:** Use `DROP FUNCTION IF EXISTS ... CASCADE` before recreating

---

## 📋 Quick Reference Commands

### **PowerShell Commands**

```powershell
# Check schema audit
Get-Content database_schema_audit.md | Select-String -Pattern "profiles" -Context 10

# Search migrations for conflicts
Select-String -Path "supabase/migrations/*.sql" -Pattern "handle_new_user" -Context 5

# Check auth provider location
Get-ChildItem -Path "components" -Recurse -Filter "*auth-provider*"

# Test database connection
npx supabase db remote commit --dry-run
```

### **SQL Verification Queries**

```sql
-- View current trigger function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- View all triggers on auth.users
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- Check recent signup attempts
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🚀 Deployment Checklist

**Before pushing auth changes to production:**

- [ ] Read `database_schema_audit.md` to verify schema
- [ ] Check `handle_new_user()` function matches schema
- [ ] Search migrations for conflicting function definitions
- [ ] Verify auth provider import paths are correct
- [ ] Test talent signup locally
- [ ] Test client signup locally
- [ ] Verify profiles created in local database
- [ ] Run `npm run build` to catch TypeScript errors
- [ ] Push to staging first
- [ ] Test signup on staging
- [ ] Monitor Supabase logs during staging test
- [ ] Only then push to production
- [ ] Monitor Sentry for auth errors after deployment

---

## 📚 Related Documentation

- `database_schema_audit.md` - Database schema single source of truth
- `docs/AUTH_STRATEGY.md` - Authentication implementation strategy
- `docs/SECURITY_CONFIGURATION.md` - Security setup and RLS policies
- `docs/TROUBLESHOOTING_GUIDE.md` - General troubleshooting
- `EMERGENCY_FIX_SIGNUP.sql` - Emergency fix for signup errors

---

## 🔄 Maintenance Schedule

**Weekly:**
- Verify no duplicate auth provider files exist
- Check for migration conflicts

**After any schema change:**
- Update `database_schema_audit.md` FIRST
- Regenerate types: `npx supabase gen types typescript`
- Update this checklist if new columns are added/removed
- Test signup flow

**After any auth code change:**
- Run through this entire checklist
- Test both talent and client signup
- Monitor Sentry for 24 hours after deployment

---

**Remember: The `database_schema_audit.md` file is the SINGLE SOURCE OF TRUTH. Always check it BEFORE making auth changes!**
