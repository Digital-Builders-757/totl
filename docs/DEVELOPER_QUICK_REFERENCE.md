# TOTL Agency Developer Quick Reference

**Last Updated:** July 22, 2025

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

### **Debug Queries**
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

## 🔗 Related Documentation
- [Full Auth Strategy](./AUTH_STRATEGY.md)
- [Database Schema Audit](./database_schema_audit.md)
- [Coding Standards](./CODING_STANDARDS.md)

---

**Remember:** Always use lowercase with underscores for metadata keys! 🎯 