# 📖 Safe Supabase Queries Guide

This guide outlines best practices for writing Supabase queries that are secure, performant, and compatible with our Row-Level Security (RLS) policies.

---

## The Core Problem: RLS and `select *`

Most issues arise from using `select("*")` or aggregate functions (`count()`, `sum()`, etc.) on tables with RLS enabled. Supabase can't always apply the correct RLS policies on nested or aggregated data, which can lead to permission errors or data leaks.

Refer to the `docs/DATABASE_GUIDE.md` to understand which RLS policies apply to each table.

---

## ✅ Best Practices

### 1. Always Select Specific Columns
Never use `select("*")`. Always specify the exact columns you need. This is the most important rule.

- **❌ Bad**: `supabase.from("profiles").select("*")`
- **✅ Good**: `supabase.from("profiles").select("id, full_name, location")`

### 2. Avoid Server-Side Aggregates
Do not use `.count()` or other aggregate functions directly in your main queries, as they often conflict with RLS. Fetch the data first, then perform the calculation on the client or server-side.

- **❌ Bad**:
  ```typescript
  const { count } = await supabase
    .from("gigs")
    .select("*", { count: 'exact', head: true });
  ```
- **✅ Good**:
  ```typescript
  const { data } = await supabase
    .from("gigs")
    .select("id"); // Select a small, indexed column
  
  const count = data?.length ?? 0;
  ```

### 3. Use Explicit `.eq()` Filters for RLS
While RLS protects the data on the backend, always include an explicit `.eq('user_id', userId)` filter in your queries where applicable. This makes the query's intent clear and can improve performance.

- **❌ Okay, but less clear**: `supabase.from("profiles").select("id, full_name")` (Relies entirely on RLS)
- **✅ Better**: `supabase.from("profiles").select("id, full_name").eq('user_id', userId)`

### 4. Use `.single()` or `.maybeSingle()` for Unique Rows
When you expect only one row, use `.single()` to get the object directly instead of an array. This will also throw an error if more than one row is returned, which is a useful sanity check.

- `.single()`: Throws an error if zero or more than one row is found.
- `.maybeSingle()`: Returns `null` if no row is found; throws an error if more than one is found.

- **❌ Bad**: `const { data } = await supabase.from("users").select().eq('id', id)`
- **✅ Good**: `const { data } = await supabase.from("users").select().eq('id', id).single()`

### 5. Use RPC Functions for Complex Queries
For complex queries that require joins or aggregations, the safest approach is to create a `SECURITY DEFINER` function in a SQL migration. This allows the function to bypass RLS (temporarily and safely within the function's scope) to perform its calculations.

**Example SQL Migration:**
```sql
CREATE OR REPLACE FUNCTION get_user_gig_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  gig_count INT;
BEGIN
  SELECT COUNT(*)
  INTO gig_count
  FROM gigs
  WHERE client_id = p_user_id;
  
  RETURN gig_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
**Example Usage:**
```typescript
const { data, error } = await supabase.rpc('get_user_gig_count', { p_user_id: userId });
```

---

## 📦 The `safeQuery` Wrapper

To simplify these practices, we use a `safeQuery` wrapper (`lib/safe-query.ts`). This utility encapsulates many of our standard data-fetching operations, ensuring they are always performed safely.

**Prefer using the `safeQuery` wrapper over writing raw queries wherever possible.**
