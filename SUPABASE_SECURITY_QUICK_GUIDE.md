# 🚀 Quick Guide: Apply Supabase Security Fixes

## Step 1: Apply Database Migration (SQL Editor)

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Navigate to**: SQL Editor (left sidebar)
3. **Open the file**: `supabase/migrations/MANUAL_APPLY_SECURITY_FIXES.sql`
4. **Copy the entire contents** of that file
5. **Paste into** the SQL Editor
6. **Click "Run"** to execute

**Expected Result**: All functions updated, materialized view secured ✅

---

## Step 2: Configure Auth Settings (Dashboard)

### Fix OTP Expiry (2 minutes)
1. Go to: **Authentication → Settings**
2. Find: **"Email Auth" section**
3. Locate: **"OTP Expiry"** field
4. Change to: `1800` (30 minutes) or `3600` (1 hour)
5. Click: **"Save"**

### Enable Leaked Password Protection (1 minute)
1. Stay in: **Authentication → Settings**
2. Find: **"Password Settings" section**
3. Toggle ON: **"Leaked Password Protection"**
4. Click: **"Save"**

---

## Step 3: Upgrade Postgres (Optional - Coordinate Timing)

⚠️ **Note**: This requires brief downtime. Coordinate with your team.

1. Go to: **Settings → Infrastructure**
2. Find: **"Postgres version" section**
3. If upgrade available: Click **"Upgrade"**
4. Follow: **Upgrade wizard**

**Recommended**: Do this during low-traffic hours

---

## Verification

After completing the steps above, verify the fixes:

1. **Run Supabase Linter**:
   - Dashboard → Database → Linter
   - Click "Run Linter"
   - Should see significantly fewer warnings ✅

2. **Test in SQL Editor**:
```sql
-- Verify functions have search_path
SELECT
  n.nspname as schema,
  p.proname as function_name,
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

---

## Summary Checklist

- [ ] **Step 1**: Run SQL migration in SQL Editor
- [ ] **Step 2a**: Set OTP expiry to ≤ 1 hour
- [ ] **Step 2b**: Enable leaked password protection
- [ ] **Step 3**: Upgrade Postgres (coordinate timing)
- [ ] **Verify**: Run linter to confirm fixes

---

## Files Reference

- **SQL to run**: `supabase/migrations/MANUAL_APPLY_SECURITY_FIXES.sql`
- **Full documentation**: `docs/SUPABASE_SECURITY_FIXES.md`

---

## Expected Results

**Before**: 13 security warnings ⚠️  
**After**: 0-3 warnings (only if Step 3 not completed) ✅

**Security Improvements**:
- ✅ Function search_path injection prevention (8 functions)
- ✅ Materialized view access control
- ✅ Admin dashboard data protection
- ✅ Shorter OTP expiry window
- ✅ Compromised password prevention
- ✅ Latest security patches (after Postgres upgrade)

---

## Need Help?

Refer to the full documentation in `docs/SUPABASE_SECURITY_FIXES.md` for:
- Detailed explanations of each fix
- Testing procedures
- Security best practices
- Troubleshooting

---

**Estimated Total Time**: 5-10 minutes (excluding Postgres upgrade)

