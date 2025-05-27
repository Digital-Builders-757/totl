# Safe Supabase Queries Guide

This guide outlines best practices for writing Supabase queries that are compatible with Row-Level Security (RLS) and avoid issues with aggregate functions.

## Common Issues

1. **Aggregate Function Errors**: Using functions like `count()`, `array_agg()`, or `sum()` in queries can cause errors with RLS.
2. **Implicit Joins**: Relying on implicit joins with `select("*")` can lead to permission issues.
3. **Missing Filters**: Not using explicit equality filters for user-based filtering.

## Best Practices

### 1. Use Explicit Column Selection

❌ **Avoid**:
\`\`\`typescript
const { data } = await supabase
  .from("profiles")
  .select("*")
\`\`\`

✅ **Use Instead**:
\`\`\`typescript
const { data } = await supabase
  .from("profiles")
  .select("id, first_name, last_name, email")
\`\`\`

### 2. Avoid Aggregate Functions

❌ **Avoid**:
\`\`\`typescript
const { data } = await supabase
  .from("profiles")
  .select("*, count(*)")
\`\`\`

✅ **Use Instead**:
\`\`\`typescript
// Fetch the raw data first
const { data } = await supabase
  .from("profiles")
  .select("id, first_name, last_name")

// Then count client-side
const count = data ? data.length : 0
\`\`\`

### 3. Use Explicit Filters

❌ **Avoid**:
\`\`\`typescript
const { data } = await supabase
  .from("profiles")
  .select("*")
\`\`\`

✅ **Use Instead**:
\`\`\`typescript
const { data } = await supabase
  .from("profiles")
  .select("id, first_name, last_name")
  .eq("user_id", user.id)
\`\`\`

### 4. Use Single/MaybeSingle for Expected Single Results

❌ **Avoid**:
\`\`\`typescript
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
\`\`\`

✅ **Use Instead**:
\`\`\`typescript
const { data } = await supabase
  .from("profiles")
  .select("id, first_name, last_name")
  .eq("id", userId)
  .single() // Throws error if not found
  // OR
  .maybeSingle() // Returns null if not found
\`\`\`

### 5. Avoid RPC Calls with Aggregates

❌ **Avoid**:
\`\`\`typescript
const { data } = await supabase.rpc('get_profile_with_counts', { user_id: userId })
\`\`\`

✅ **Use Instead**:
\`\`\`typescript
// Fetch profile data
const { data: profile } = await supabase
  .from("profiles")
  .select("id, first_name, last_name")
  .eq("id", userId)
  .single()

// Separately fetch related data if needed
const { data: relatedItems } = await supabase
  .from("related_items")
  .select("id")
  .eq("user_id", userId)

// Calculate counts client-side
const itemCount = relatedItems ? relatedItems.length : 0
\`\`\`

## Using the Safe Query Utility

We've created a `safeQuery` utility that implements these best practices:

\`\`\`typescript
import { safeQuery } from '@/lib/safe-query'

// In your component
const { data, error } = await safeQuery.getProfileByUserId(supabase, userId)
\`\`\`

## Troubleshooting

If you encounter "Use of aggregate functions is not allowed" errors:

1. Check for any `count()`, `sum()`, `array_agg()` functions in your queries
2. Look for any RPC calls that might use aggregates internally
3. Ensure you're using explicit column selection
4. Verify that you're using proper equality filters
