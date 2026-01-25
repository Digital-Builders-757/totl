# PR4: Query Strategy Cleanup — Remove Enumeration Pattern

**Date:** December 21, 2025  
**Status:** ✅ COMPLETE  
**Purpose:** Eliminate enumeration pattern in `/talent/[slug]` route by replacing "fetch all then filter" with bounded candidate queries.

---

## Summary

PR4 completes the Approach B + G1 implementation by removing the last structural violation: the enumeration pattern that fetched all talent profiles before filtering by slug. This change ensures no query ever selects more than 25 rows and eliminates implicit directory behavior.

---

## Changes Made

### 1. Replaced Enumeration Query with Bounded Candidate Queries (`app/talent/[slug]/page.tsx`)

**Before (Lines 59-105):**
```typescript
// BAD: Fetches ALL talent profiles
const { data: allTalent } = await supabase
  .from("talent_profiles")
  .select(PUBLIC_FIELDS)
  .order("created_at", { ascending: false }); // ❌ Enumeration

// Then filters in memory
const slugMatch = allTalent.find((t) => {
  const talentSlug = createNameSlug(t.first_name, t.last_name);
  return talentSlug === slug;
});
```

**After (Lines 57-145):**
```typescript
// PR4: Bounded candidate query - no enumeration
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nameParts = parseSlug(slug);

let candidates: PublicTalentProfile[] = [];

// Strategy A: UUID path (exact match, fast, backward compatibility)
if (uuidRegex.test(slug)) {
  const { data } = await supabase
    .from("talent_profiles")
    .select(PUBLIC_FIELDS)
    .or(`id.eq.${slug},user_id.eq.${slug}`)
    .limit(1); // ✅ Bounded
}

// Strategy B: Name-based path (bounded candidates)
else if (nameParts) {
  const { data } = await supabase
    .from("talent_profiles")
    .select(PUBLIC_FIELDS)
    .ilike("first_name", nameParts.firstName)
    .ilike("last_name", `%${nameParts.lastName}%`)
    .limit(25); // ✅ Hard cap to prevent enumeration
}

// Final exact slug match on small candidate set
const exactMatches = candidates.filter((t) => {
  const talentSlug = createNameSlug(t.first_name, t.last_name);
  return talentSlug === slug;
});

// Ambiguity handling: duplicates return notFound() (no guessing)
if (exactMatches.length === 1) {
  talent = { ...exactMatches[0], phone: null };
} else if (exactMatches.length > 1) {
  talent = null; // Multiple matches = ambiguous = unavailable
}
```

**Key Improvements:**
- ✅ No `.order("created_at")` — enumeration eliminated
- ✅ UUID path: `limit(1)` — exact match, fast
- ✅ Name path: `limit(25)` — hard cap prevents enumeration
- ✅ Ambiguity handling: duplicates return `notFound()` (preserves privacy)
- ✅ Uses existing `parseSlug()` helper (no new utilities needed)

### 2. Updated Imports

**Added:**
- `parseSlug` from `@/lib/utils/slug` (already existed, now used)

**Removed:**
- Duplicate `createNameSlug` import

---

## Files Changed

### Page Components (Data Layer)
1. `app/talent/[slug]/page.tsx` — Replaced enumeration query with bounded candidate queries (lines 57-145)

**No other files changed** — implementation is contained to single route.

---

## Verification

### Build & Lint
- ✅ `npm run build` — PASSED (57 pages compiled successfully)
- ✅ `npm run lint` — PASSED (no ESLint warnings or errors)

### Proof Hooks (Verification Commands)

```bash
# Verify no enumeration queries remain
grep -r "\.order(\"created_at\")" app/talent/[slug]/
# Result: ✅ No matches

# Verify bounded queries use limit
grep -r "\.limit(" app/talent/[slug]/
# Result: ✅ limit(1) for UUID path, limit(25) for name path

# Verify no select('*')
grep -r "select('\*')" app/talent/[slug]/
# Result: ✅ No matches (explicit column selection)
```

### Manual Verification Checklist

**Name-based slug resolution:**
- ✅ `/talent/john-doe` (known talent) → loads correctly
- ✅ `/talent/unknown-person-123` → returns 404
- ✅ `/talent/invalid---slug` → returns 404

**UUID-based slug resolution (backward compatibility):**
- ✅ `/talent/<known-uuid>` → loads correctly
- ✅ `/talent/<unknown-uuid>` → returns 404

**Signed-out access:**
- ✅ Public marketing profiles load correctly
- ✅ No sensitive fields visible

**Relationship-bound access (regression test):**
- ✅ Client with relationship sees phone
- ✅ Client without relationship does not see phone
- ✅ Self-view sees phone
- ✅ Admin sees phone

**Query discipline:**
- ✅ No query returns >25 rows
- ✅ No "select all talent_profiles" anywhere
- ✅ No `.order("created_at")` enumeration pattern

---

## Policy Matrix Alignment

All changes align with `docs/POLICY_MATRIX_APPROACH_B.md`:

- ✅ `/talent/[slug]` resolves without enumeration (bounded queries only)
- ✅ No implicit directory behavior (no "fetch all then filter")
- ✅ Ambiguity handling preserves privacy (duplicates return 404)
- ✅ UUID backward compatibility preserved
- ✅ Public marketing profiles remain accessible (no auth required)
- ✅ Relationship-bound sensitive fields still work (PR3 logic preserved)

---

## Risk Assessment

**Risk Level:** Low

**Why:**
- Single file change (contained scope)
- No schema changes (Option B compliant)
- No red zone files touched (no middleware/auth changes)
- Bounded queries reduce risk (hard caps prevent runaway queries)
- Existing PR3 logic preserved (sensitive field access unchanged)

**Rollback Plan:**
- Revert changes to `app/talent/[slug]/page.tsx` (lines 57-145)
- No database migrations or schema changes to roll back

---

## Architectural Compliance

**Constitution Invariants Respected:**
- ✅ No `select('*')` — explicit column selection maintained
- ✅ RLS respected — uses same user-level client as before
- ✅ No DB calls in client components — query logic stays server-side
- ✅ No generated type edits — works with existing schema
- ✅ Missing profile is valid bootstrap state — works for signed-out users

**Airport Zones Touched:**
- **Locks Zone:** Query respects RLS policies (no changes to policies)
- **Staff Zone:** Server component data fetching (where enumeration was eliminated)
- **Terminal Zone:** UI rendering (unchanged)

**RED ZONE INVOLVED:** NO

---

## Performance Impact

**Before PR4:**
- Query fetches ALL talent profiles (unbounded)
- Scales poorly as talent count grows
- Creates implicit directory behavior

**After PR4:**
- UUID path: 1 row max (exact match)
- Name path: 25 rows max (bounded candidates)
- Final match: in-memory on small set (fast)

**Expected Improvement:**
- Faster queries (bounded vs unbounded)
- Lower database load (no full-table scans)
- Better scalability (performance doesn't degrade with growth)

---

## Compliance Score

**Before PR4:** 100% policy compliance, but enumeration pattern remained  
**After PR4:** 100% policy compliance + no enumeration ✅

**All Approach B + G1 structural violations resolved.**

---

## Next Steps

1. ✅ PR4 Complete — Query strategy cleanup (enumeration eliminated)
2. **Future:** Monitor query performance as talent count grows
3. **Future:** Consider slug column migration (Option 4A from plan) if scale demands it

---

**RED ZONE INVOLVED:** NO

**Architectural Compliance:** ✅ All changes follow Airport Model and Architecture Constitution

