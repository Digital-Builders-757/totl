# PR4: Query Strategy Cleanup — Remove Enumeration Pattern

**Date:** December 21, 2025  
**Status:** 📋 PLAN (AUDIT + PLAN MODE — NO REFACTOR YET)  
**Purpose:** Eliminate enumeration pattern in `/talent/[slug]` route by replacing "fetch all then filter" with bounded candidate queries.

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Read
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` — Non-negotiables and red zone protocol
- ✅ `database_schema_audit.md` — Schema structure and RLS policies
- ✅ `docs/POLICY_MATRIX_APPROACH_B.md` — Approach B + G1 policy (no talent directory)
- ✅ `app/talent/[slug]/page.tsx` — Current implementation (lines 59-105 show enumeration)
- ✅ `lib/utils/slug.ts` — Slug creation/parsing utilities

### Diagrams Used
- **`docs/diagrams/airport-model.md`** — Used to classify zones touched:
  - **Locks Zone** (RLS enforcement, query patterns)
  - **Terminal Zone** (UI rendering, no DB logic)
  - **Staff Zone** (Server component data fetching)

**Why these diagrams:** This is a data fetching optimization that touches RLS (Locks), server-side queries (Staff), and affects what the UI receives (Terminal). No auth/bootstrap/redirect changes, so no signup-flow diagram needed.

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 1. **No `select('*')` — Always Select Explicit Columns**
- **Rule:** All queries must explicitly list columns, never use `select('*')`
- **How it limits design:** The bounded candidate query must use explicit column selection matching the current `PUBLIC_FIELDS` list. Cannot shortcut with wildcards.

### 2. **RLS is Final Authority — Never Bypass with Service Role**
- **Rule:** RLS policies must be respected; never bypass with service role in client/browser code
- **How it limits design:** The bounded query must work under RLS constraints. Cannot use admin/service role to fetch all rows. Must use user-level client that respects RLS policies.

### 3. **No DB Calls in Client Components**
- **Rule:** Client components cannot perform database queries
- **How it limits design:** All query logic must remain in the server component (`app/talent/[slug]/page.tsx`). Cannot move slug resolution to client-side.

### 4. **Never Edit Generated Types**
- **Rule:** `types/database.ts` is auto-generated only
- **How it limits design:** Cannot add new columns or types. Must work with existing `talent_profiles` schema: `first_name`, `last_name`, `id`, `user_id`.

### 5. **Missing Profile is a Valid Bootstrap State**
- **Rule:** Middleware must allow safe routes; changes must prevent redirect loops
- **How it limits design:** The slug resolution must not break for signed-out users (public marketing profiles). Cannot introduce auth dependencies that would cause redirect loops.

**RED ZONE INVOLVED: NO**

**Why:** This change touches:
- Server component data fetching (not middleware)
- Query patterns (not RLS policies themselves)
- No auth/bootstrap/redirect logic changes
- No Stripe/webhook changes

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones Touched

#### **Locks Zone (RLS / DB Constraints)**
- **Why:** Query must respect RLS policies on `talent_profiles` table
- **Responsibility:** Ensure bounded queries work under existing RLS (public read allowed for marketing fields)
- **Must stay OUT:** Cannot bypass RLS or use service role

#### **Staff Zone (Server Actions / API Routes / Business Logic)**
- **Why:** Server component performs data fetching (this is where the enumeration happens)
- **Responsibility:** Replace unbounded query with bounded candidate query based on slug parsing
- **Must stay OUT:** No business logic changes (access control, relationship checks remain unchanged)

#### **Terminal Zone (UI Pages & Components)**
- **Why:** UI receives the resolved talent data (no change to rendering logic)
- **Responsibility:** Continue rendering public marketing profiles as before
- **Must stay OUT:** No DB queries, no access logic changes

### Zones NOT Touched

- **Security Zone:** No middleware/routing changes
- **Ticketing Zone:** No auth/billing changes
- **Manifest Zone:** No profile creation/modification
- **Announcements Zone:** No email/notification changes
- **Baggage Zone:** No storage/upload changes
- **Control Tower:** No admin tools/webhook changes

### Zone Violations to Avoid

- ❌ **Do NOT** move query logic to client component (Terminal violation)
- ❌ **Do NOT** bypass RLS with service role (Locks violation)
- ❌ **Do NOT** add schema migrations (Option B constraint)

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Option A: Bounded Candidate Query with Name Parsing (RECOMMENDED)

**High-level description:**
Parse slug into name tokens, query for candidates matching `first_name` and `last_name` using `ilike`, then apply in-memory slug match on the small candidate set. UUID fallback for backward compatibility.

**Files expected to change:**
1. `app/talent/[slug]/page.tsx` — Replace lines 59-105 (enumeration query) with bounded candidate query
2. `lib/utils/slug.ts` — Add `parseNameSlug()` helper if not already present (already exists at line 32)

**Data model impact:** None (no schema changes)

**Key risks:**
- **Redirect loops:** None (no routing/auth changes)
- **Profile bootstrap gaps:** None (no auth changes)
- **RLS enforcement:** Low risk — bounded query uses same RLS as current query (public read allowed)
- **Stripe/webhook idempotency:** N/A (no billing changes)

**Why this respects Constitution:**
- ✅ Uses explicit column selection (no `select('*')`)
- ✅ Respects RLS (uses same user-level client)
- ✅ Keeps query logic in server component
- ✅ No generated type edits
- ✅ Works for signed-out users (public marketing profiles)

**Why this respects Airport boundaries:**
- ✅ Stays in Staff zone (server component)
- ✅ Respects Locks zone (RLS policies)
- ✅ Terminal zone unchanged (rendering logic untouched)

**Query shape:**
```typescript
// UUID path (exact match, fast)
if (uuidRegex.test(slug)) {
  .or(`id.eq.${slug},user_id.eq.${slug}`)
  .limit(1)
}

// Name-based path (bounded candidates)
else if (nameParts) {
  .ilike("first_name", nameParts.firstName)
  .ilike("last_name", `%${nameParts.lastName}%`)
  .limit(25) // hard cap
}
```

**Ambiguity handling:**
- If no match found → `notFound()`
- If multiple exact slug matches → `notFound()` (no guessing)

---

### Option B: UUID-Only URLs with Slug Redirect

**High-level description:**
Change public URLs to UUIDs (`/talent/<user_id>`), keep name slugs as marketing aliases that redirect to UUID.

**Files expected to change:**
1. `app/talent/[slug]/page.tsx` — Query by UUID only
2. `middleware.ts` — Add slug→UUID redirect logic (if slugs still supported)
3. All places that generate `/talent/[slug]` links (many files)

**Data model impact:** None (no schema changes)

**Key risks:**
- **Redirect loops:** Medium risk — redirect logic in middleware could cause loops if not careful
- **Profile bootstrap gaps:** Low risk — redirects are safe
- **RLS enforcement:** Low risk — UUID queries are straightforward
- **Stripe/webhook idempotency:** N/A

**Why this respects Constitution:**
- ✅ Uses explicit column selection
- ✅ Respects RLS
- ✅ No generated type edits

**Why this respects Airport boundaries:**
- ⚠️ Touches Security zone (middleware redirects) — increases risk
- ✅ Respects Locks zone

**Drawback:** Requires updating many link generators and breaks existing slug URLs (SEO/backlinks).

---

### Option C: Postgres RPC Function

**High-level description:**
Create a Postgres function `resolve_talent_slug(slug text)` that returns exactly one row, never returns lists.

**Files expected to change:**
1. `supabase/migrations/` — New migration adding RPC function
2. `app/talent/[slug]/page.tsx` — Call RPC instead of direct query

**Data model impact:** New database function (migration required)

**Key risks:**
- **Redirect loops:** None
- **Profile bootstrap gaps:** None
- **RLS enforcement:** Medium risk — RPC functions must respect RLS or use `SECURITY DEFINER` carefully
- **Stripe/webhook idempotency:** N/A

**Why this violates Option B constraint:**
- ❌ Requires schema migration (Option B explicitly says "no migrations")
- ❌ Adds database function (schema change)

**Why this respects Constitution:**
- ✅ Uses explicit column selection (in function)
- ✅ Respects RLS (if function uses `SECURITY INVOKER`)
- ✅ No generated type edits (function returns existing types)

**Drawback:** Violates Option B "no migrations" constraint.

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- ✅ Known name-based slugs (e.g., `/talent/john-doe`) resolve correctly
- ✅ Known UUID-based slugs (e.g., `/talent/123e4567-e89b-12d3-a456-426614174000`) resolve correctly
- ✅ Unknown slugs return 404 (`notFound()`)
- ✅ Duplicate names (same slug) return 404 (no guessing)
- ✅ Public marketing profiles render correctly (no sensitive fields by default)
- ✅ Relationship-bound sensitive fields still work (client with relationship sees phone)

### Data Correctness
- ✅ No query ever selects more than 25 rows for slug resolution
- ✅ No query uses `.order("created_at")` or unbounded `select()`
- ✅ Explicit column selection matches current `PUBLIC_FIELDS` list
- ✅ UUID fallback works for backward compatibility

### Permissions & Access Control
- ✅ Signed-out users can view public marketing profiles (no auth required)
- ✅ Signed-in users see same public fields + relationship-bound sensitive fields
- ✅ RLS policies remain enforced (no service role bypass)
- ✅ Admin override still works for sensitive fields

### Failure Cases (What Must NOT Happen)
- ❌ No full-table scans (`select()` without `limit()`)
- ❌ No enumeration queries (fetch all then filter)
- ❌ No redirect loops (no routing changes)
- ❌ No RLS bypass (no service role usage)
- ❌ No schema changes (no migrations)
- ❌ No client-side DB queries (query logic stays server-side)

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path
1. **Name-based slug resolution:**
   - Navigate to `/talent/john-doe` (known talent)
   - Verify profile loads correctly
   - Verify public fields visible
   - Verify no sensitive fields visible (unless relationship exists)

2. **UUID-based slug resolution:**
   - Navigate to `/talent/<known-uuid>` (backward compatibility)
   - Verify profile loads correctly
   - Verify same behavior as name-based slug

3. **Signed-out access:**
   - Sign out
   - Navigate to `/talent/john-doe`
   - Verify public marketing profile loads
   - Verify no sensitive fields visible

#### Edge Cases
1. **Unknown slug:**
   - Navigate to `/talent/unknown-person-123`
   - Verify 404 page (`notFound()`)

2. **Duplicate names (ambiguous slug):**
   - If two talents share same name (same slug)
   - Navigate to `/talent/shared-name`
   - Verify 404 page (no guessing, preserves privacy)

3. **Malformed slug:**
   - Navigate to `/talent/invalid---slug`
   - Verify 404 page or graceful handling

4. **Empty slug:**
   - Navigate to `/talent/` (edge case)
   - Verify middleware handles correctly (should redirect or 404)

#### Relationship-Bound Access (Regression Test)
1. **Client with relationship:**
   - Sign in as client
   - Navigate to `/talent/<talent-who-applied-to-client-gig>`
   - Verify sensitive fields (phone) visible

2. **Client without relationship:**
   - Sign in as client
   - Navigate to `/talent/<talent-with-no-relationship>`
   - Verify sensitive fields NOT visible

3. **Self-view:**
   - Sign in as talent
   - Navigate to own profile `/talent/<own-slug>`
   - Verify sensitive fields visible

### Automated Tests to Add/Update

**If test suite exists:**
- Add unit test for `parseNameSlug()` helper (edge cases: hyphenated names, single word, empty)
- Add integration test for bounded query (verify `limit(25)` is applied)
- Add integration test for UUID fallback
- Add integration test for duplicate name handling (404)

**If no test suite:**
- Document manual test checklist in PR description

### RED ZONE Regression Checks

**Not applicable** — No red zone files touched (no middleware/auth/bootstrap changes)

**However, verify:**
- ✅ No new queries in client components
- ✅ No RLS policy changes
- ✅ No auth flow changes

---

## Implementation Details

### Current Enumeration Pattern (Lines 59-105 in `app/talent/[slug]/page.tsx`)

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

### Proposed Bounded Query Pattern (Option A)

```typescript
// Parse slug into name parts
const nameParts = parseNameSlug(slug); // Already exists in lib/utils/slug.ts

let candidates = [];

if (uuidRegex.test(slug)) {
  // UUID path: exact match, fast
  const { data } = await supabase
    .from("talent_profiles")
    .select(PUBLIC_FIELDS)
    .or(`id.eq.${slug},user_id.eq.${slug}`)
    .limit(1);
  candidates = data ?? [];
} else if (nameParts) {
  // Name-based path: bounded candidates
  const { data } = await supabase
    .from("talent_profiles")
    .select(PUBLIC_FIELDS)
    .ilike("first_name", nameParts.firstName)
    .ilike("last_name", `%${nameParts.lastName}%`)
    .limit(25); // Hard cap
  candidates = data ?? [];
}

// Final in-memory slug match (safe, small set)
const match = candidates.find(
  t => createNameSlug(t.first_name, t.last_name) === slug
);

if (!match) {
  notFound();
}

// Handle duplicates: if multiple exact matches, return 404
const exactMatches = candidates.filter(
  t => createNameSlug(t.first_name, t.last_name) === slug
);
if (exactMatches.length > 1) {
  notFound(); // Ambiguity = unavailable (preserves privacy)
}

talent = { ...match, phone: null };
```

### Proof Hooks (Verification Commands)

```bash
# Verify no enumeration queries remain
grep -r "\.order(\"created_at\")" app/talent/[slug]/
# Should return: no matches

# Verify bounded queries use limit
grep -r "\.limit(" app/talent/[slug]/
# Should return: matches showing limit(25) or limit(1)

# Verify no select('*')
grep -r "select('\*')" app/talent/[slug]/
# Should return: no matches
```

---

## Summary

**Recommended Approach:** **Option A** (Bounded Candidate Query with Name Parsing)

**Why:**
- ✅ No schema migrations (Option B compliant)
- ✅ Minimal diff (single file change)
- ✅ No red zone files touched (low risk)
- ✅ Preserves backward compatibility (UUID fallback)
- ✅ Eliminates enumeration (bounded queries with hard cap)
- ✅ Respects all Constitution invariants
- ✅ Respects Airport boundaries

**Risk Level:** Low

**Estimated Effort:** Small (1-2 hours)

**Dependencies:** None (uses existing `parseNameSlug()` helper)

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

**Recommendation:** Implement **Option A** with the bounded candidate query pattern as described above.

