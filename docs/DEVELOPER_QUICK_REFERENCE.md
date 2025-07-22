# TOTL Agency Developer Quick Reference

**Last Updated:** July 22, 2025

## Table of Contents
- [Critical Requirements](#critical-requirements)
- [Signup Flow](#signup-flow)
- [Troubleshooting](#troubleshooting)
- [Debug Queries](#debug-queries)
- [Testing Checklist](#testing-checklist)
- [Related Documentation](#related-documentation)

## 🚨 Critical Requirements

### **Metadata Key Naming**
- **MUST use snake_case** for all user metadata keys
- **Correct:** `first_name`, `last_name`, `role`, `company_name`
- **Wrong:** `firstName`, `lastName`, `Role`, `companyName`

### **Database Triggers**
- Profile creation is automatic via `handle_new_user()` trigger
- Trigger handles NULL values gracefully with COALESCE
- Uses explicit schema references: `user_role::public.user_role`

### **Role Assignment**
- Default role: `talent`
- Valid roles: `talent`, `client`, `admin`
- Role determines which profile table is created

## 🔄 Signup Flow

1. **User submits signup form** with metadata
2. **Supabase creates auth.users record**
3. **Trigger fires** `on_auth_user_created`
4. **Profile created** in `profiles` table
5. **Role-specific profile** created in `talent_profiles` or `client_profiles`
6. **Email verification** required before login
7. **Role-based redirect** to appropriate dashboard

## 🛠️ Troubleshooting

### **Common Errors & Fixes**

#### **"type user_role does not exist" Error**
```sql
-- Check if enum exists
SELECT n.nspname as "Schema", t.typname as "Name"
FROM pg_type t
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typtype = 'e' AND t.typname = 'user_role';

-- If missing, recreate:
CREATE TYPE user_role AS ENUM ('talent', 'client', 'admin');
```

#### **NULL Value Constraint Violations**
- Trigger function uses COALESCE for safe defaults
- Empty strings used instead of NULL for required fields
- Check metadata key naming (must be snake_case)

#### **Profile Creation Failures**
```sql
-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

## 🔍 Debug Queries

### **Basic Debugging**
```sql
-- Check user metadata
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'user@example.com';

-- Check profile creation
SELECT p.*, tp.first_name, tp.last_name, cp.company_name
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id
WHERE p.id = 'user-uuid';

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

### **Advanced Debugging**
```sql
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

-- Find users with NULL metadata (potential issues)
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE raw_user_meta_data IS NULL OR raw_user_meta_data = '{}';

-- Check for metadata with wrong key names
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE raw_user_meta_data::text LIKE '%firstName%' 
   OR raw_user_meta_data::text LIKE '%lastName%'
   OR raw_user_meta_data::text LIKE '%companyName%';

-- Verify trigger function exists and is correct
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

### **Enum Type Verification**
```sql
-- Check if user_role enum exists and has correct values
SELECT n.nspname as "Schema", t.typname as "Name"
FROM pg_type t
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typtype = 'e' AND t.typname = 'user_role';

-- Test enum casting
SELECT 'talent'::user_role as test_cast;

-- Check profiles table role column type
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

## 📋 Testing Checklist

### **Pre-Signup**
- [ ] Database migrations applied
- [ ] `user_role` enum exists
- [ ] Trigger function exists
- [ ] Trigger attached to `auth.users`

### **Signup Testing**
- [ ] Complete talent signup with all fields
- [ ] Complete client signup with company name
- [ ] Signup with missing optional fields
- [ ] Signup with wrong metadata keys (should fail gracefully)
- [ ] Email verification flow

### **Post-Signup Verification**
- [ ] Profile created in `profiles` table
- [ ] Role-specific profile created
- [ ] Email verification status correct
- [ ] Role-based redirect works

### **Production Health Checks**
```sql
-- Run these queries to verify system health
-- 1. No orphaned users
SELECT COUNT(*) as orphaned_users FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. All profiles have correct roles
SELECT role, COUNT(*) FROM profiles GROUP BY role;

-- 3. Email verification status
SELECT email_verified, COUNT(*) FROM profiles GROUP BY email_verified;

-- 4. Profile completion status
SELECT 
  p.role,
  COUNT(*) as total_profiles,
  COUNT(tp.user_id) as talent_profiles,
  COUNT(cp.user_id) as client_profiles
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id
GROUP BY p.role;
```

## 📚 Related Documentation

- **[Auth Strategy](./AUTH_STRATEGY.md)** - Complete authentication architecture
- **[Database Schema Audit](../database_schema_audit.md)** - Full schema with constraints
- **[Testing Script](../scripts/test-signup-flow.ts)** - Automated signup testing

---

**Need help?** Check the troubleshooting section above, then consult the full Auth Strategy document. 