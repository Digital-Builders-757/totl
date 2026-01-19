# Audit Policy Decisions

**Date:** December 2025  
**Purpose:** Document policy decisions for automated audits

---

## Directory Scanning Policy

### Targeted Directory Scanning

**Decision:** Audit scripts scan only specific directories (`app/`, `lib/`, `components/`, `hooks/`) instead of root-walking with ignore lists.

**Why:**
- More deterministic (explicit boundaries)
- Faster (doesn't scan unnecessary directories)
- Reduces false positives

**Guard Against Blind Spots:**
- Audit scripts detect new top-level directories (`src/`, `features/`, `packages/`, `server/`, `shared/`, `modules/`, `services/`)
- If detected, audit fails with instructions to either:
  1. Add the directory to `TARGET_DIRS` if it contains source code
  2. Add the directory to `IGNORE_DIRS` if it doesn't

**Current Scope:**
- `TARGET_DIRS`: `["app", "lib", "components", "hooks"]`
- `IGNORE_DIRS`: `["node_modules", ".next", "dist", "build", ".git", "scripts", "tests", "docs", "supabase", "public", "styles", "types"]`

---

## `.single()` vs `.maybeSingle()` Policy

### Current Status: Warning (Not Failing)

**Decision:** The `.single()` audit currently **warns** but doesn't fail the build.

**Why:**
- Allows migration period for existing code
- Provides visibility into all `.single()` usages for review
- Prevents blocking development while codebase is being updated

### When `.single()` is Allowed

✅ **Allowed for:**
- Queries where the record MUST exist (e.g., after a successful insert)
- Internal operations where missing data indicates a bug
- Admin operations with guaranteed data (e.g., fetching by primary key after verification)
- Utility functions in `lib/safe-query.ts` that document their guarantees

**Example (Allowed):**
```ts
// After successful insert - record MUST exist
const { data } = await supabase
  .from("gigs")
  .select("id, title")
  .eq("id", gigId)
  .single(); // ✅ OK - we just inserted this
```

### When `.single()` is Discouraged

⚠️ **Discouraged for:**
- User-input-driven queries (e.g., fetching by user-provided ID)
- Profile queries (`profiles`, `talent_profiles`, `client_profiles`) - use `.maybeSingle()`
- Authentication/authorization checks - use `.maybeSingle()`
- Any query where the record might not exist

**Example (Discouraged):**
```ts
// User-provided ID - might not exist
const { data } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", userId) // ❌ User-provided - might not exist
  .single(); // ❌ Should use .maybeSingle()

// ✅ Correct:
const { data } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", userId)
  .maybeSingle(); // ✅ Returns null if doesn't exist
```

### Future Policy

**Planned:** Once the codebase is fully migrated, the audit may be changed to **fail** in CI (not just warn).

**Migration Path:**
1. Review all `.single()` usages listed by audit
2. Update discouraged patterns to `.maybeSingle()`
3. Document allowed `.single()` patterns
4. Change audit to fail on violations

---

## Select Star Policy

### Current Status: Failing

**Decision:** The `select('*')` audit **fails the build** (hard enforcement).

**Why:**
- Core invariant: explicit column selection prevents exposing sensitive fields
- Explicit columns prevent breakage when schema changes
- Easy to fix (just list columns explicitly)

**No exceptions** - all `select('*')` usage must be fixed.

---

## Client Boundary Policy

### Current Status: Failing

**Decision:** The client boundary audit **fails the build** (hard enforcement).

**Why:**
- Prevents prerender/build failures
- Browser client requires `"use client"` directive
- Clear violation pattern (easy to fix)

**No exceptions** - all browser client imports must be in client components.

---

## Summary

| Audit | Status | Action on Violation |
|-------|--------|---------------------|
| Client Boundaries | ✅ Failing | Hard fail - prevents build errors |
| Select Star | ✅ Failing | Hard fail - core invariant |
| Single vs MaybeSingle | ⚠️ Warning | Warns - allows migration period |

---

**Last Updated:** December 2025
