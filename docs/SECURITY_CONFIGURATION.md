# 🔒 Security Configuration Guide

**Last Updated:** January 1, 2025  
**Status:** Production Ready

This document outlines the security configurations that need to be set up manually in the Supabase dashboard to resolve remaining security warnings.

## ⚠️ Manual Configuration Required

The following security settings cannot be configured via migrations and must be set up manually in the Supabase dashboard:

### 1. Auth OTP Expiry Configuration

**Issue:** OTP expiry exceeds recommended threshold (currently set to more than 1 hour)

**Fix:** 
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Find the **Email Auth** section
4. Set **OTP Expiry** to **1 hour** or less (recommended: 30 minutes)
5. Save the changes

**Why this matters:** Shorter OTP expiry times reduce the window of opportunity for unauthorized access if an OTP is compromised.

### 2. Leaked Password Protection

**Issue:** Leaked password protection is currently disabled

**Fix:**
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Find the **Password Security** section
4. Enable **Leaked Password Protection**
5. Save the changes

**Why this matters:** This feature checks passwords against HaveIBeenPwned.org to prevent users from using compromised passwords.

### 3. Extension in Public Schema

**Issue:** `pg_trgm` extension is installed in the public schema

**Fix:**
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Extensions**
3. Find the `pg_trgm` extension
4. Move it to a dedicated schema (e.g., `extensions` schema)
5. Update any code that references the extension

**Why this matters:** Extensions in the public schema can pose security risks and pollute the namespace.

## 🔧 Automated Fixes Applied

The following security issues have been automatically fixed via migrations:

### ✅ Function Search Path Mutable
- **Fixed:** All 10 functions now have explicit `SET search_path = public`
- **Functions updated:**
  - `test_enum_casting()`
  - `test_trigger_function_exists()`
  - `ensure_profile_completion()`
  - `backfill_missing_profiles()`
  - `maintenance_cleanup()`
  - `get_query_hints()`
  - `handle_new_user()`
  - `gigs_search_update()`
  - `update_modified_column()`
  - `update_updated_at_column()`

### ✅ Security Definer View
- **Fixed:** `performance_metrics` view no longer uses SECURITY DEFINER
- **Impact:** View now respects user permissions properly

## 📋 Security Checklist

### Before Going to Production
- [ ] Configure OTP expiry to 1 hour or less
- [ ] Enable leaked password protection
- [ ] Move pg_trgm extension to dedicated schema
- [ ] Review all RLS policies
- [ ] Test authentication flows
- [ ] Verify user permissions work correctly

### Ongoing Security Maintenance
- [ ] Regularly review security advisor warnings
- [ ] Monitor authentication logs
- [ ] Keep dependencies updated
- [ ] Review and update RLS policies as needed
- [ ] Test security configurations regularly

## 🔍 Verification Commands

### Check Security Warnings
```bash
# Check current security advisor warnings
supabase db lint
```

### Test Authentication
```bash
# Test OTP functionality
# (Test through your application's auth flow)
```

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Auth Configuration Guide](https://supabase.com/docs/guides/auth)
- [RLS Policy Examples](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)

---

**Remember:** Security is an ongoing process. Regularly review and update your security configurations as your application evolves. 