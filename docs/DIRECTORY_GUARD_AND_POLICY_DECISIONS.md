# Directory Guard & Policy Decisions ✅

**Date:** December 2025  
**Status:** Implemented and documented

---

## Summary

Implemented directory guard to prevent blind spots and documented `.single()` policy decisions.

---

## ✅ Directory Guard Implementation

### Problem
Targeted directory scanning (`app/`, `lib/`, `components/`, `hooks/`) is deterministic and fast, but creates a blind spot: if new top-level directories are added (`src/`, `features/`, `packages/`, etc.), they won't be scanned.

### Solution
Added lightweight guard that detects new top-level directories matching common source code patterns and fails the audit with clear instructions.

**Guard Logic:**
```js
// Detects these patterns if they exist but aren't in TARGET_DIRS:
const POTENTIAL_SOURCE_DIRS = ["src", "features", "packages", "server", "shared", "modules", "services"];

// If found, audit fails with:
// 1. List of new directories
// 2. Instructions to add to TARGET_DIRS (if source) or IGNORE_DIRS (if not)
```

**Benefits:**
- Preserves deterministic scanning (good default)
- Prevents blind spots (fails loudly if new directories appear)
- Clear action items (tells you exactly what to do)

**Current Configuration:**
- `TARGET_DIRS`: `["app", "lib", "components", "hooks"]`
- `IGNORE_DIRS`: `["node_modules", ".next", "dist", "build", ".git", "scripts", "tests", "docs", "supabase", "public", "styles", "types"]`
- `POTENTIAL_SOURCE_DIRS`: `["src", "features", "packages", "server", "shared", "modules", "services"]`

---

## ✅ `.single()` Policy Decision

### Current Status: Warning (Not Failing)

**Decision:** The `.single()` audit currently **warns** but doesn't fail the build.

**Rationale:**
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

## 📋 Audit Status Summary

| Audit | Status | Action on Violation | Rationale |
|-------|--------|---------------------|------------|
| Client Boundaries | ✅ Failing | Hard fail | Prevents build errors |
| Select Star | ✅ Failing | Hard fail | Core invariant |
| Single vs MaybeSingle | ⚠️ Warning | Warns | Migration period |
| Directory Guard | ✅ Failing | Hard fail | Prevents blind spots |

---

## 📝 Files Changed

**Updated:**
- `scripts/audit-client-boundaries.mjs` - Added directory guard
- `docs/MASTER_BUILD_AND_DEPLOYMENT_RULES.md` - Documented directory guard and `.single()` policy
- `docs/AUDIT_POLICY_DECISIONS.md` - Created comprehensive policy document

---

## ✅ Verification

### Directory Guard Working
```bash
$ npm run audit:client-boundaries
✅ audit-client-boundaries: no violations found
```

### No New Directories Detected
Current directory structure matches expected patterns.

---

**Last Updated:** December 2025
