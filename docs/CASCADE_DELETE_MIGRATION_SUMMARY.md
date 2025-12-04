# CASCADE DELETE Migration Summary

**Date:** December 4, 2025  
**Migration File:** `supabase/migrations/20251204150904_add_cascade_delete_constraints.sql`  
**Status:** ✅ Ready for Review

---

## 🎯 Purpose

This migration ensures that when a user is deleted from `auth.users`, all related data is automatically cascaded and deleted, preventing orphaned records and maintaining data integrity.

---

## 📋 What This Migration Does

### **Public Schema Constraints (Applied)**

The migration explicitly enforces `ON DELETE CASCADE` on the following foreign keys:

1. **`profiles.id` → `auth.users.id`**
   - When a user is deleted from `auth.users`, their profile is automatically deleted

2. **Child tables referencing `profiles.id`:**
   - `talent_profiles.user_id` → `profiles.id`
   - `client_profiles.user_id` → `profiles.id`
   - `applications.talent_id` → `profiles.id`
   - `bookings.talent_id` → `profiles.id`
   - `portfolio_items.talent_id` → `profiles.id`
   - `gigs.client_id` → `profiles.id`
   - `content_flags.reporter_id` → `profiles.id`

3. **Direct references to `auth.users.id`:**
   - `gig_notifications.user_id` → `auth.users.id`

4. **Special case - `content_flags`:**
   - `assigned_admin_id` → `profiles.id` **ON DELETE SET NULL** (preserves flags when admin is deleted)

### **Auth Schema Constraints (Commented Out)**

The migration includes commented-out SQL for auth schema tables (`identities`, `sessions`, `refresh_tokens`, `mfa_factors`, etc.). These are **NOT applied** because:

- Auth schema tables are managed by Supabase
- Modifying these constraints may cause issues or be reverted by Supabase updates
- Supabase likely handles cascading internally for these tables

**Recommendation:** Test Supabase's default behavior first. Only uncomment these if you verify that Supabase doesn't handle cascading automatically.

---

## ⚠️ Important Notes

### **Before Running:**

1. **Maintenance Window:** This migration alters existing constraints - run during a maintenance window
2. **RLS Policies:** RLS policies are NOT affected by these changes
3. **Service Role:** Deletes initiated by `service_role` (admin dashboard, server) will cascade
4. **Backup:** Always backup your database before running migrations

### **What Happens When a User is Deleted:**

When a user is deleted from `auth.users`, the following cascade occurs:

```
auth.users (DELETE)
  ↓ CASCADE
profiles (DELETE)
  ↓ CASCADE
  ├─ talent_profiles (DELETE)
  ├─ client_profiles (DELETE)
  ├─ applications (DELETE)
  ├─ bookings (DELETE)
  ├─ portfolio_items (DELETE)
  ├─ gigs (DELETE) → applications, bookings, gig_requirements also cascade
  └─ content_flags.reporter_id (DELETE)
  
gig_notifications.user_id (DELETE - direct reference)
```

### **What is Preserved:**

- `content_flags` where the user was an assigned admin → `assigned_admin_id` set to NULL
- `content_flags` where the user reported → flag is deleted (reporter_id cascades)

---

## ✅ Verification

After running the migration, verify all constraints have CASCADE:

```sql
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'profiles', 'talent_profiles', 'client_profiles', 
    'applications', 'bookings', 'portfolio_items', 
    'gigs', 'gig_notifications', 'content_flags'
  )
ORDER BY tc.table_name;
```

All `delete_rule` values should be `CASCADE` (except `content_flags.assigned_admin_id` which should be `SET NULL`).

---

## 📝 Documentation Updates

The following documentation has been updated:

1. **`database_schema_audit.md`**
   - Added migration to key migrations list
   - Updated "Recent Updates" section with cascade delete enforcement details
   - Updated foreign key relationships section to include `content_flags` constraints

2. **This document** (`docs/CASCADE_DELETE_MIGRATION_SUMMARY.md`)
   - Complete summary of the migration and its effects

---

## 🚀 Next Steps

1. **Review the migration file:** `supabase/migrations/20251204150904_add_cascade_delete_constraints.sql`
2. **Test locally:** Run `supabase db reset` to test the migration
3. **Verify constraints:** Run the verification query above
4. **Apply to production:** After testing, apply via `supabase db push` or your deployment process

---

## 🔍 Testing Checklist

- [ ] Migration runs without errors
- [ ] All constraints show CASCADE in verification query
- [ ] Test user deletion: Create a test user, add related data, delete user, verify all data is removed
- [ ] Test admin deletion: Create a flag assigned to an admin, delete admin, verify flag remains but `assigned_admin_id` is NULL
- [ ] Verify RLS policies still work correctly
- [ ] Check that no orphaned records exist after user deletion

---

**Migration Status:** ✅ Ready for review and testing

