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

### **Metadata Key Naming Convention**
**⚠️ ALWAYS use lowercase with underscores:**

```typescript
// ✅ CORRECT
{
  first_name: "John",      // lowercase with underscore
  last_name: "Doe",        // lowercase with underscore
  role: "talent",          // lowercase
  company_name: "Acme Co"  // lowercase with underscore
}

// ❌ WRONG - Will cause NULL constraint violations
{
  firstName: "John",       // camelCase
  lastName: "Doe",         // camelCase
  Role: "talent",          // PascalCase
  companyName: "Acme Co"   // camelCase
}
```

### **Required Metadata Keys**
```typescript
// Talent Signup
{
  first_name: string,    // Required
  last_name: string,     // Required
  role: "talent"         // Required
}

// Client Signup
{
  first_name: string,     // Required
  last_name: string,      // Required
  role: "client",         // Required
  company_name: string    // Optional (defaults to display_name)
}
```

## 🔄 Signup Flow

### **1. Frontend Signup**
```typescript
const { error } = await signUp(email, password, {
  data: {
    first_name: firstName,    // ✅ lowercase with underscore
    last_name: lastName,      // ✅ lowercase with underscore
    role: "talent",           // ✅ lowercase
  },
  emailRedirectTo: `${window.location.origin}/auth/callback`,
});
```

### **2. Database Trigger**
- Fires automatically on `auth.users` INSERT
- Creates `profiles` record with role
- Creates `talent_profiles` or `client_profiles` record
- Handles NULL metadata gracefully

### **3. Email Verification**
- User clicks verification link
- Goes to `/auth/callback`
- Updates `email_verified = true`
- Redirects to role-based dashboard

## 🛠️ Troubleshooting

### **Common Errors**

#### **"null value violates not-null constraint"**
**Cause:** Wrong metadata key naming (camelCase instead of snake_case)  
**Fix:** Use lowercase with underscores

#### **Profile not created**
**Cause:** Trigger not firing  
**Fix:** Check if `on_auth_user_created` trigger exists

#### **Wrong role assigned**
**Cause:** Missing or incorrect role in metadata  
**Fix:** Ensure `role` is set to `"talent"` or `"client"`

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

## 📋 Testing Checklist

### **Before Deploying**
- [ ] Test talent signup with complete metadata
- [ ] Test talent signup with missing names
- [ ] Test client signup with complete metadata
- [ ] Test client signup with missing company name
- [ ] Test OAuth signup (minimal metadata)
- [ ] Verify email verification flow
- [ ] Verify role-based redirects

### **Edge Cases to Test**
- [ ] Empty metadata object `{}`
- [ ] NULL metadata
- [ ] Missing role in metadata
- [ ] Wrong metadata key names (camelCase)
- [ ] Special characters in names

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

## 🔗 Related Documentation
- [Full Auth Strategy](./AUTH_STRATEGY.md)
- [Database Schema Audit](./database_schema_audit.md)
- [Coding Standards](./CODING_STANDARDS.md)

---

**Remember:** Always use lowercase with underscores for metadata keys! 🎯 