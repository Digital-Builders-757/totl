# Supabase Security Fixes Guide

## Overview
This document outlines the security warnings from Supabase's database linter and the steps taken to fix them.

## ✅ Fixed via Migration (20251016164259_fix_security_warnings.sql)

### 1. Function Search Path Mutable (8 functions)
**Issue**: Functions without explicit `search_path` setting are vulnerable to search path injection attacks.

**Fix**: Added `SET search_path = ''` to all functions:
- `update_bookings_updated_at()`
- `update_portfolio_items_updated_at()`
- `handle_new_user()`
- `set_updated_at()`
- `refresh_admin_dashboard_cache()`
- `update_modified_column()`
- `analyze_tables()`
- `get_slow_queries()`

**Status**: ✅ Fixed in migration

### 2. Materialized View in API
**Issue**: `admin_dashboard_cache` materialized view was accessible to anon/authenticated roles.

**Fix**: 
- Revoked all public access
- Restricted to service_role only
- Created secure wrapper function `get_admin_dashboard_stats()` with admin role verification
- Added RLS-style access control

**Status**: ✅ Fixed in migration

## ⚠️ Manual Fixes Required (Supabase Dashboard)

### 3. Extension in Public Schema
**Issue**: `pg_trgm` extension is installed in the `public` schema.

**How to Fix**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the following SQL:
```sql
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm to extensions schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Grant usage
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
```

**Status**: ⚠️ Requires manual execution (needs superuser privileges)

### 4. Auth OTP Long Expiry
**Issue**: OTP expiry is set to more than 1 hour (recommended: < 1 hour).

**How to Fix**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Navigate to "Email Auth" section
3. Find "OTP expiry" setting
4. Change from current value to `3600` seconds (1 hour) or less
5. Recommended: `1800` seconds (30 minutes)
6. Click "Save"

**Status**: ⚠️ Requires dashboard configuration

### 5. Leaked Password Protection Disabled
**Issue**: HaveIBeenPwned password leak protection is disabled.

**How to Fix**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Navigate to "Password Settings" section
3. Find "Leaked Password Protection" toggle
4. Enable the toggle
5. Click "Save"

**Benefits**:
- Prevents users from using passwords that appear in known data breaches
- Integrates with HaveIBeenPwned.org database
- Enhances overall account security

**Status**: ⚠️ Requires dashboard configuration

### 6. Vulnerable Postgres Version
**Issue**: Current version `supabase-postgres-15.8.1.079` has security patches available.

**How to Fix**:
1. Go to Supabase Dashboard → Settings → Infrastructure
2. Navigate to "Postgres version" section
3. Click "Upgrade available" if shown
4. Review the upgrade notes
5. Click "Upgrade database"
6. Follow the upgrade wizard

**Important Notes**:
- Database upgrades may require brief downtime
- Test in staging environment first if possible
- Backup is automatically created before upgrade
- Review migration guide: https://supabase.com/docs/guides/platform/upgrading

**Status**: ⚠️ Requires dashboard action (coordinate with team for maintenance window)

## Testing After Fixes

### 1. Test Database Migration
```bash
# Apply migration locally
npx supabase db reset

# Or push to remote
npx supabase db push
```

### 2. Verify Function Security
```sql
-- Check that functions have search_path set
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN proconfig IS NOT NULL AND array_to_string(proconfig, ',') LIKE '%search_path%' 
    THEN '✅ Set'
    ELSE '❌ Not Set'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

### 3. Verify Materialized View Security
```sql
-- Should return no rows (access denied to regular users)
SELECT * FROM public.admin_dashboard_cache;

-- Should work for admin users via the wrapper function
SELECT * FROM public.get_admin_dashboard_stats();
```

### 4. Run Supabase Linter
After applying all fixes:
1. Go to Supabase Dashboard → Database → Linter
2. Click "Run Linter"
3. Verify that all security warnings are resolved

## Summary Checklist

- [x] Function search_path warnings (automated via migration)
- [x] Materialized view access control (automated via migration)
- [ ] Move pg_trgm extension (manual SQL)
- [ ] Reduce OTP expiry (dashboard setting)
- [ ] Enable leaked password protection (dashboard setting)
- [ ] Upgrade Postgres version (dashboard action - coordinate timing)

## Security Best Practices Going Forward

1. **Always set search_path** when creating new functions
2. **Use SECURITY DEFINER** carefully and only when necessary
3. **Implement RLS** on all new tables and materialized views
4. **Regularly run the Supabase linter** to catch new warnings
5. **Keep Postgres updated** to get latest security patches
6. **Review auth settings** periodically for best practices

## References

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Function Search Path Security](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Extension Security](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
- [Going Into Production](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Password Security](https://supabase.com/docs/guides/auth/password-security)
- [Postgres Upgrades](https://supabase.com/docs/guides/platform/upgrading)

