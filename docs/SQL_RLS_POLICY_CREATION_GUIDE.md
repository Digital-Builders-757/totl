# SQL RLS Policy Creation Guide

**Last Updated:** November 18, 2025  
**Purpose:** Complete guide for creating PostgreSQL RLS policies correctly on the first try

---

## 🚨 Critical Rule: PostgreSQL Does NOT Support `IF NOT EXISTS` with `CREATE POLICY`

**❌ WRONG - This will cause a syntax error:**
```sql
CREATE POLICY IF NOT EXISTS "Policy name" 
ON public.table_name
FOR SELECT
TO authenticated
USING (condition);
```

**Error you'll get:**
```
ERROR: syntax error at or near "NOT"
```

---

## ✅ Correct Pattern: Use DO Blocks with Conditional Checks

PostgreSQL requires using `DO $$` blocks with conditional checks to create policies idempotently.

### **Standard Template for SELECT Policies**

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'table_name'
      AND policyname = 'Policy name'
  ) THEN
    CREATE POLICY "Policy name"
      ON public.table_name
      FOR SELECT
      TO authenticated
      USING (
        -- Your condition here
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;
```

### **Template for ALL Operations (INSERT, UPDATE, DELETE)**

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'table_name'
      AND policyname = 'Policy name'
  ) THEN
    CREATE POLICY "Policy name"
      ON public.table_name
      FOR ALL
      TO authenticated
      USING (
        -- Your condition here
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      )
      WITH CHECK (
        -- Your check condition here (for INSERT/UPDATE)
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;
```

---

## 📋 Common Policy Patterns

### **1. Admin-Only Access**

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Admins can view all applications'
  ) THEN
    CREATE POLICY "Admins can view all applications"
      ON public.applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;
```

### **2. User Owns Record**

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (id = (SELECT auth.uid()));
  END IF;
END$$;
```

### **3. Public Read Access**

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gigs'
      AND policyname = 'Public can view active gigs'
  ) THEN
    CREATE POLICY "Public can view active gigs"
      ON public.gigs
      FOR SELECT
      TO anon, authenticated
      USING (status = 'active');
  END IF;
END$$;
```

### **4. Related Record Access (e.g., Client sees applications for their gigs)**

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Clients can view gig applications'
  ) THEN
    CREATE POLICY "Clients can view gig applications"
      ON public.applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM gigs 
          WHERE gigs.id = applications.gig_id 
          AND gigs.client_id = (SELECT auth.uid())
        )
      );
  END IF;
END$$;
```

---

## 🔧 Key Components Explained

### **DO $$ Block**
- Wraps the conditional logic
- Allows checking if policy exists before creating
- Must end with `END$$;`

### **pg_policies Catalog Query**
```sql
SELECT 1
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'table_name'
  AND policyname = 'Policy name'
```
- Checks if policy already exists
- Prevents duplicate policy errors
- Makes migration idempotent (safe to run multiple times)

### **Policy Components**

| Component | Purpose | Options |
|-----------|---------|---------|
| `FOR SELECT` | Read access | `SELECT` only |
| `FOR INSERT` | Create access | `INSERT` only |
| `FOR UPDATE` | Modify access | `UPDATE` only |
| `FOR DELETE` | Remove access | `DELETE` only |
| `FOR ALL` | All operations | All CRUD operations |

| Role | Purpose |
|------|---------|
| `TO anon` | Anonymous/unauthenticated users |
| `TO authenticated` | Logged-in users |
| `TO public` | All users (both anon and authenticated) |

### **USING vs WITH CHECK**

- **USING**: Condition for SELECT, UPDATE, DELETE
- **WITH CHECK**: Condition for INSERT, UPDATE (validates new/modified data)

**Example with both:**
```sql
CREATE POLICY "Example policy"
  ON public.table_name
  FOR ALL
  TO authenticated
  USING (
    -- Check existing records
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    -- Validate new/modified records
    user_id = (SELECT auth.uid())
  );
```

---

## 📝 Complete Example: Admin Access to Applications

Here's a complete, production-ready example:

```sql
-- =====================================================
-- APPLICATIONS TABLE - Admin Policies
-- =====================================================

-- Admins can view all applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Admins can view all applications'
  ) THEN
    CREATE POLICY "Admins can view all applications"
      ON public.applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;

-- Admins can manage all applications (INSERT, UPDATE, DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Admins can manage all applications'
  ) THEN
    CREATE POLICY "Admins can manage all applications"
      ON public.applications
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;
```

---

## ✅ Best Practices

### **1. Always Use DO Blocks**
- Never use `IF NOT EXISTS` directly with `CREATE POLICY`
- Always wrap in `DO $$ ... END$$;` block

### **2. Check pg_policies Catalog**
- Always query `pg_policies` to check if policy exists
- Use exact policy name match for safety

### **3. Use (SELECT auth.uid()) Pattern**
- Performance optimization: `(SELECT auth.uid())` is cached
- More efficient than `auth.uid()` in some contexts
- Follows project conventions

### **4. Make Migrations Idempotent**
- Every policy creation should be safe to run multiple times
- Use conditional checks, never assume policy doesn't exist

### **5. Test in Development First**
- Always test RLS policies in local development
- Verify with different user roles
- Check both allowed and denied access patterns

### **6. Document Policy Purpose**
- Add comments explaining what the policy does
- Note any special conditions or edge cases
- Reference related policies or tables

---

## 🔍 Troubleshooting

### **Error: "policy already exists"**
- **Cause:** Policy was created without conditional check
- **Fix:** Drop policy first, then recreate with DO block:
  ```sql
  DROP POLICY IF EXISTS "Policy name" ON public.table_name;
  -- Then use DO block to create it
  ```

### **Error: "syntax error at or near NOT"**
- **Cause:** Used `IF NOT EXISTS` directly with `CREATE POLICY`
- **Fix:** Wrap in DO block as shown in templates above

### **Error: "relation does not exist"**
- **Cause:** Table name or schema is incorrect
- **Fix:** Verify table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'your_table';`

### **Policy Not Working**
- **Check RLS is enabled:** `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`
- **Verify user role:** Check `profiles` table for correct role
- **Test with different users:** Ensure policy logic is correct

---

## 📚 Related Documentation

- `database_schema_audit.md` - Complete database schema and RLS policies
- `DEVELOPER_QUICK_REFERENCE.md` - General development quick reference
- `SECURITY_CONFIGURATION.md` - Security best practices
- `AUTH_STRATEGY.md` - Authentication and authorization patterns

---

## 🎯 Quick Reference Checklist

When creating a new RLS policy:

- [ ] Use `DO $$ ... END$$;` block (never `IF NOT EXISTS` directly)
- [ ] Check `pg_policies` catalog before creating
- [ ] Use `(SELECT auth.uid())` pattern for performance
- [ ] Include both `USING` and `WITH CHECK` for `FOR ALL` policies
- [ ] Test with different user roles
- [ ] Update `database_schema_audit.md` after creating policy
- [ ] Add comments explaining policy purpose
- [ ] Make migration idempotent (safe to run multiple times)

---

**Remember:** Always use DO blocks with conditional checks. This is the only PostgreSQL-compatible way to create RLS policies idempotently!

