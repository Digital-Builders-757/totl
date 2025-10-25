# TOTL Agency Authentication Strategy

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
2. User selects "Join as Talent" or "Join as Client" → proceeds to role-specific signup
3. After signup → email verification → role-based dashboard redirect

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
3. User selects "Join as Talent" or "Join as Client"
   ↓
4. Proceeds to role-specific signup form
   ↓
5. Supabase Auth creates user + trigger creates profile
   ↓
6. Email verification required
   ↓
7. Redirect to role-based dashboard
```

### **Database Schema**
```
auth.users (Supabase Auth)
    ↓ (trigger)
profiles (Main user profiles)
    ↓ (1:1 relationship)
talent_profiles OR client_profiles (Role-specific data)
```

### **Key Tables**

#### **profiles Table**
```sql
id              UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id)
role            user_role NOT NULL DEFAULT 'talent'
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

#### **Client Signup**
```typescript
// From: components/client-signup-form.tsx
const { error } = await signUp(data.email, data.password, {
  data: {
    first_name: data.firstName,    // ✅ lowercase with underscore
    last_name: data.lastName,      // ✅ lowercase with underscore
    role: "client",                // ✅ lowercase
    company_name: data.companyName, // ✅ lowercase with underscore
  },
  emailRedirectTo: `${window.location.origin}/auth/callback`,
});
```

### **2. Database Trigger Process**

#### **Trigger Function: `handle_new_user()`**
```sql
-- Location: supabase/migrations/20250722015600_fix_handle_new_user_trigger_null_handling.sql
-- Fires: AFTER INSERT ON auth.users

-- Safe metadata extraction with defaults
user_role := COALESCE(new.raw_user_meta_data->>'role', 'talent');
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
INSERT INTO profiles (id, role, display_name, email_verified)
VALUES (new.id, user_role::user_role, display_name, new.email_confirmed_at IS NOT NULL);

-- Create role-specific profile
IF user_role = 'talent' THEN
  INSERT INTO talent_profiles (user_id, first_name, last_name)
  VALUES (new.id, user_first_name, user_last_name);
ELSIF user_role = 'client' THEN
  INSERT INTO client_profiles (user_id, company_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'company_name', display_name));
END IF;
```

## 🚨 Critical Requirements

### **Metadata Key Naming Convention**
**⚠️ CRITICAL:** All metadata keys must use **lowercase with underscores**:

```typescript
// ✅ CORRECT - Will work with trigger
{
  first_name: "John",      // lowercase with underscore
  last_name: "Doe",        // lowercase with underscore
  role: "talent",          // lowercase
  company_name: "Acme Co"  // lowercase with underscore
}

// ❌ WRONG - Will cause NULL values in database
{
  firstName: "John",       // camelCase - trigger won't find this
  lastName: "Doe",         // camelCase - trigger won't find this
  Role: "talent",          // PascalCase - trigger won't find this
  companyName: "Acme Co"   // camelCase - trigger won't find this
}
```

### **NOT NULL Column Protection**
All NOT NULL columns are protected with safe defaults:

| Column | Table | Default | Protection |
|--------|-------|---------|------------|
| `role` | profiles | `'talent'` | COALESCE with 'talent' default |
| `first_name` | talent_profiles | `''` | COALESCE with empty string |
| `last_name` | talent_profiles | `''` | COALESCE with empty string |
| `company_name` | client_profiles | `display_name` | COALESCE with display_name fallback |

## 🧪 Testing Scenarios

### **Edge Cases Handled**
All scenarios have been tested and work correctly:

| Scenario | Metadata | Result | Notes |
|----------|----------|--------|-------|
| Complete Talent | `{"first_name": "John", "last_name": "Doe", "role": "talent"}` | ✅ Success | Normal signup flow |
| Partial Talent | `{"role": "talent"}` | ✅ Success | Missing names default to empty strings |
| Empty Metadata | `{}` | ✅ Success | All defaults applied |
| NULL Metadata | `NULL` | ✅ Success | All defaults applied |
| Client Missing Company | `{"role": "client"}` | ✅ Success | Company name defaults to display_name |
| OAuth User | Minimal metadata | ✅ Success | Graceful fallbacks applied |

## 🔧 Troubleshooting

### **Common Issues**

#### **"null value violates not-null constraint"**
**Cause:** Metadata keys using wrong naming convention (camelCase instead of snake_case)  
**Solution:** Ensure all metadata keys use lowercase with underscores

#### **Profile not created after signup**
**Cause:** Trigger function not firing  
**Solution:** Check if `on_auth_user_created` trigger exists on `auth.users` table

#### **Wrong role assigned**
**Cause:** Missing or incorrect role in metadata  
**Solution:** Ensure `role` is set to `"talent"` or `"client"` in signup metadata

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
1. Always use lowercase with underscores for metadata keys
2. Include role in every signup call
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

## 🔗 Related Documentation
- [Database Schema Audit](../database_schema_audit.md)
- [Developer Quick Reference](./DEVELOPER_QUICK_REFERENCE.md)
- [Coding Standards](./CODING_STANDARDS.md)
- [Security Fixes Summary](../SECURITY_FIXES_SUMMARY.md)

---

**Maintainer:** TOTL Agency Development Team  
**Last Review:** July 25, 2025  
**Next Review:** August 25, 2025 