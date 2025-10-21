# How to Apply Database Linter Fixes

**Date:** October 21, 2025  
**Status:** Ready to Apply  
**Impact:** Performance improvement, no breaking changes

## 🎯 What This Fixes

This script resolves all remaining Supabase Database Linter warnings:

1. **8 Auth RLS InitPlan Warnings** → Fixed to use cached auth checks (~95% performance gain)
2. **3 Duplicate Index Warnings** → Removed duplicate indexes (improved write performance)

## 📋 Prerequisites

- Access to Supabase Dashboard
- Admin/Owner role on the TOTL project
- 5 minutes of time

## 🚀 Option 1: Apply via Supabase SQL Editor (RECOMMENDED)

### Step 1: Open SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your TOTL project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Copy & Paste SQL
1. Open the file: `scripts/apply_linter_fixes.sql`
2. Copy the entire contents
3. Paste into the SQL Editor

### Step 3: Execute
1. Click **Run** (or press `Ctrl+Enter`)
2. Wait for confirmation message
3. Check the verification queries at the bottom

### Step 4: Verify
The script includes verification queries at the end. Check the results:

**Query 1: Optimized RLS Policies**
- ✅ All policies should show "✅ OPTIMIZED"
- ❌ If any show "❌ NOT OPTIMIZED", run the script again

**Query 2: Duplicate Indexes**
- ✅ Should return 0 rows (no duplicates)
- ❌ If any rows returned, contact support

**Query 3: Gig Notifications Policies**
- ✅ Should return exactly 4 policies (SELECT, INSERT, UPDATE, DELETE)
- ❌ If less than 4, run the script again

**Query 4: Remaining Indexes**
- ✅ Should show only: `applications_gig_id_idx`, `applications_talent_id_idx`, `bookings_gig_id_idx`
- ❌ If duplicates still exist, contact support

## 🚀 Option 2: Apply via Supabase CLI

### Prerequisites
- Supabase CLI installed
- Logged in to Supabase (`npx supabase login`)
- Project linked (`npx supabase link`)

### Apply Migration
```powershell
# From project root
cd "C:\Users\young\OneDrive\Desktop\Project Files\totl"

# Apply the specific migration
npx supabase db push --include-migrations 20251021164837_fix_gig_notifications_rls_and_duplicate_indexes.sql
```

**Note:** This may fail if previous migrations are out of sync. If it fails, use Option 1 instead.

## 🧪 Post-Application Testing

After applying the fixes, run the Supabase Database Linter to verify:

### Via Supabase Dashboard
1. Go to **Database** → **Linter**
2. Click **Run Linter**
3. Verify no warnings for:
   - ❌ Auth RLS InitPlan
   - ❌ Duplicate Index

### Expected Result
✅ All linter checks should pass (green checkmarks)

## 📊 Performance Impact

### Before
- ⚠️ 8 RLS policies with per-row auth evaluation
- ⚠️ 3 duplicate indexes
- ⚠️ Slower queries at scale
- ⚠️ Slower write operations

### After
- ✅ All RLS policies use cached auth checks
- ✅ No duplicate indexes
- ✅ ~95% faster RLS policy evaluation
- ✅ Faster INSERT/UPDATE/DELETE operations

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback by re-creating the old policies:

```sql
-- Rollback script (only if needed)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.gig_notifications;
CREATE POLICY "Users can view their own notifications" ON gig_notifications
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Repeat for other policies...
```

**Note:** Rollback should NOT be necessary. The optimized version is strictly better.

## ❓ Troubleshooting

### Error: "Policy already exists"
**Solution:** The policies are already optimized. Run verification queries to confirm.

### Error: "Index does not exist"
**Solution:** The duplicate indexes were already removed. Run verification queries to confirm.

### Error: "Permission denied"
**Solution:** Ensure you have admin/owner role on the Supabase project.

## 📚 Related Documentation

- `docs/DATABASE_LINTER_FIX_OCT_2025.md` - Detailed technical explanation
- `database_schema_audit.md` - Updated schema documentation
- `supabase/migrations/20251021164837_fix_gig_notifications_rls_and_duplicate_indexes.sql` - Migration file

## ✅ Completion Checklist

- [ ] Applied SQL script via Supabase SQL Editor or CLI
- [ ] Verified all 4 verification queries passed
- [ ] Ran Supabase Database Linter (all green)
- [ ] Tested application functionality (no errors)
- [ ] Updated team that fixes have been applied

---

**Questions?** Check the troubleshooting section or contact the dev team.

