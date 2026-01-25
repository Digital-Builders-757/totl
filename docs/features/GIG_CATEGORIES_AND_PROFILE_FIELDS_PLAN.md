# Gig Categories & Profile Fields Migration Plan

**Date:** January 2026  
**Status:** 📋 PLAN COMPLETE (Ready for Implementation)  
**Purpose:** Migrate gig categories from modeling-specific to diverse talent categories, and make talent profile forms category-appropriate (hide modeling-specific fields for non-modeling talent).

---

## Executive Summary

**Goal:** 
1. Replace modeling-specific gig categories (editorial, commercial, runway, print, fitness, beauty, promotional) with diverse talent categories (modeling, acting, photography, video, influencer, dancer, musician)
2. Make talent profile forms context-aware: hide modeling-specific fields (shoe_size, height, measurements, hair_color, eye_color) for non-modeling talent types

**Approach:** Two-phase migration:
- **Phase 1:** Update gig categories across all forms and displays
- **Phase 2:** Make profile fields conditional based on talent type/specialty

**Risk Level:** Medium (affects UI/UX and data collection, but no schema changes required)

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` — No violations (UI/form changes only, minimal Staff zone for validation)
- ✅ `database_schema_audit.md` — **VERIFIED:** `talent_profiles.specialties` exists as `text[]` field (line 163). No schema changes needed (fields remain in DB, just hidden conditionally)
- ✅ `docs/diagrams/role-surfaces.md` — Terminal zone only (UI pages and components)
- ✅ `app/post-gig/actions.ts` — **VERIFIED:** No Zod enum validation for categories (accepts `string`)
- ✅ `lib/actions/profile-actions.ts` — **VERIFIED:** Profile update uses full `.update()` (needs PATCH-style protection)

### Diagrams Used
- **Terminal Zone** (`docs/diagrams/role-surfaces.md`) — UI pages and components where categories/forms appear
- **Staff Zone** (minimal) — Server action validation updates if needed, PATCH-style update protection

### Critical Pre-Implementation Verification
**Before coding, verify:**
1. ✅ `talent_profiles.specialties` field exists (confirmed: `text[]` in schema)
2. ✅ Server actions accept `category: string` without enum validation (confirmed: no Zod enum)
3. ✅ Profile update actions use full `.update()` (confirmed: needs PATCH protection)

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 5 Most Relevant Non-Negotiables

1. **"No DB calls in client components"**
   - **How it limits:** Category filtering and field visibility logic must be client-side only. No new data fetching for conditional rendering.

2. **"All mutations are server-side"**
   - **How it limits:** Form submission logic remains unchanged. Server actions continue to accept all fields (they're just optional in DB).

3. **"RLS is final authority"**
   - **How it limits:** No access changes. All talent can still update their profiles, just with different fields visible.

4. **"Missing profile is a valid bootstrap state"**
   - **How it limits:** Onboarding forms must handle conditional fields gracefully. New talent signup flow must not break.

5. **"No `select('*')`"**
   - **How it limits:** Profile queries must continue to select explicit columns. Field visibility changes don't affect query patterns.

**RED ZONE INVOLVED:** NO

**Rationale:** This is primarily a UI/form change. Minimal Staff zone changes may be needed for:
- Server-side category validation (if any exists)
- PATCH-style profile updates (prevent data wiping)

No middleware, auth, RLS, or Stripe changes. Database schema remains unchanged (fields stay nullable/optional).

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones Touched

**Terminal Zone (UI Pages & Components)** ✅
- **Why:** All changes occur in UI components, forms, and category displays
- **What stays OUT:** No business logic changes, no data fetching changes, no routing changes

**Staff Zone (Server Actions - Minimal)** ⚠️
- **Why:** May need to update server-side category validation if any exists, and MUST implement PATCH-style profile updates to prevent data wiping
- **What stays OUT:** No new business logic, no new queries, only protective updates

### Zones NOT Touched

- **Security Zone:** No middleware/routing changes
- **Ticketing Zone:** No Stripe/billing changes
- **Locks Zone:** No RLS/DB constraint changes
- **Control Tower:** No admin tool logic changes (admin can still see all fields)

**Zone Violations to Avoid:**
- ❌ Do not change database column names or constraints
- ❌ Do not change form field names that map to database columns
- ❌ Do not change server action signatures (fields remain optional)
- ❌ Do not add new database queries for conditional rendering

---

## STEP 3 — DESIGN PROPOSALS

### Approach A: Category-Based Field Visibility (RECOMMENDED)

**High-level description:**
- Replace all gig category dropdowns with new categories: modeling, acting, photography, video, influencer, dancer, musician
- Add a "primary category" or "talent type" field to talent profiles (or infer from specialties)
- Conditionally show/hide modeling-specific fields (shoe_size, height, measurements, hair_color, eye_color) based on talent type
- Keep all fields in database (they remain nullable/optional)

**Files expected to change:**

**Phase 1 - Category Updates:**
- `app/post-gig/page.tsx` (category dropdown)
- `app/admin/gigs/create/create-gig-form.tsx` (admin category dropdown)
- `app/client/apply/page.tsx` (client application category)
- `app/gigs/page.tsx` (category filter dropdown)
- `app/client/dashboard/page.tsx` (category badge colors/mapping)
- `app/client/gigs/client.tsx` (category badge colors)
- `app/talent/dashboard/client.tsx` (category badge colors)
- `app/gigs/[id]/page.tsx` (category badge display)
- `app/gigs/[id]/apply/page.tsx` (category badge display)

**Phase 2 - Conditional Profile Fields:**
- `components/forms/talent-personal-info-form.tsx` (conditional field rendering)
- `components/forms/talent-profile-form.tsx` (conditional field rendering)
- `app/settings/sections/talent-details.tsx` (conditional field rendering)
- Add logic to determine talent type (from specialties or new field)

**Data model impact:** 
- **Option A (No DB change):** Infer talent type from `talent_profiles.specialties` array (if contains "modeling" → show modeling fields)
- **Option B (Minimal DB change):** Add optional `primary_category` text field to `talent_profiles` table (nullable, defaults to null)

**Key risks:**
- **Redirect loops:** None (no routing changes)
- **Profile bootstrap gaps:** None (onboarding forms handle optional fields)
- **RLS enforcement:** None (no access rule changes)
- **Stripe/webhook idempotency:** None (no payment flow changes)
- **Existing data:** Old categories in database will need migration or backward compatibility
- **Data wiping:** ⚠️ **CRITICAL** - Hidden fields submitted as null/empty will wipe existing modeling data. Must implement PATCH-style updates (only update fields that are present in form submission)
- **Server-side validation:** May need to update Zod schemas or validation if category enums exist server-side

**Why this approach respects:**
- ✅ **Constitution:** No violations (UI changes + minimal Staff zone protective updates)
- ✅ **Airport boundaries:** Terminal zone (primary) + minimal Staff zone (protective updates only)
- ✅ **Selected diagrams:** Role surfaces (UI copy/forms)

---

### Approach B: Specialty-Based Field Visibility (ALTERNATIVE)

**High-level description:**
- Keep gig categories as-is but add new ones alongside
- Use `talent_profiles.specialties` array to determine which fields to show
- If specialties include modeling-related terms → show modeling fields
- Otherwise → hide modeling fields

**Why NOT recommended:**
- More complex logic (parsing specialties array)
- Less explicit than a dedicated field
- Harder to maintain and extend

---

### Approach C: Separate Forms by Category (NOT RECOMMENDED)

**High-level description:**
- Create separate profile forms for each talent category
- Different routes/components for modeling vs photography vs acting

**Why NOT recommended:**
- Violates DRY principle (duplicate form logic)
- Harder to maintain
- More complex routing
- Doesn't align with unified talent profile concept

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior

**Phase 1 - Category Updates:**
- ✅ All gig posting forms show new categories: modeling, acting, photography, video, influencer, dancer, musician
- ✅ All category filters/dropdowns use new categories
- ✅ Category badge colors/styles work with new categories
- ✅ Existing gigs with old categories still display (backward compatibility or migration)

**Phase 2 - Conditional Profile Fields:**
- ✅ Modeling talent see: shoe_size, height, measurements, hair_color, eye_color fields
- ✅ Non-modeling talent (photography, video, etc.) do NOT see modeling-specific fields
- ✅ All talent see: phone, age, location, experience, portfolio_url, languages (universal fields)
- ✅ Form validation works correctly (modeling fields optional for all, required only when visible)
- ✅ Profile display pages show/hide fields based on talent type
- ✅ **CRITICAL:** Hidden fields are omitted from form submission (not sent as null/empty) to prevent data wiping
- ✅ **CRITICAL:** Server actions use PATCH-style updates (only update fields present in payload)

### Data Correctness

- ✅ No database column names changed
- ✅ No form field names changed (only visibility)
- ✅ Server actions continue to accept all fields (they're optional in DB)
- ✅ Existing profiles with modeling data remain intact
- ✅ New talent can create profiles without modeling fields

### Permissions & Access Control

- ✅ No access rules changed
- ✅ No RLS policies affected
- ✅ No middleware logic changed
- ✅ All talent can still update their profiles

### Failure Cases (What Must NOT Happen)

- ❌ Form submissions break due to hidden fields
- ❌ Database queries fail due to field visibility changes
- ❌ Onboarding flow breaks due to conditional fields
- ❌ Existing gigs become unviewable due to category changes
- ❌ Category filters stop working
- ❌ **CRITICAL:** Existing modeling data gets wiped when non-modeling talent updates profile (hidden fields sent as null)
- ❌ **CRITICAL:** Server-side category validation rejects new categories (if any validation exists)

---

## STEP 5 — TEST PLAN

### Manual Test Steps

**Phase 1 - Category Updates:**
1. ✅ Navigate to `/post-gig` as client
2. ✅ Verify category dropdown shows: modeling, acting, photography, video, influencer, dancer, musician
3. ✅ Post a gig with each new category
4. ✅ Navigate to `/gigs` and verify category filter works
5. ✅ Verify category badges display correctly on gig cards
6. ✅ Verify existing gigs with old categories still display (or are migrated)

**Phase 2 - Conditional Profile Fields:**
1. ✅ Navigate to talent profile form as modeling talent
2. ✅ Verify modeling fields visible: shoe_size, height, measurements, hair_color, eye_color
3. ✅ Fill in modeling fields (e.g., shoe_size: "9", height: "5'10\"")
4. ✅ Submit form and verify data saved
5. ✅ Navigate to talent profile form as photography talent (or set specialties to photography)
6. ✅ Verify modeling fields are HIDDEN
7. ✅ **CRITICAL TEST:** Update profile WITHOUT modeling fields visible
8. ✅ **CRITICAL TEST:** Verify existing modeling data (shoe_size, height, etc.) is NOT wiped/erased
9. ✅ Verify profile displays correctly (modeling fields shown/hidden based on type)
10. ✅ Test onboarding flow with conditional fields

### Automated Tests

- ✅ No new automated tests needed (UI/form changes)
- ✅ Existing E2E tests should continue to pass (no logic changes)
- ✅ Consider adding tests for conditional field visibility

### RED ZONE Regression Checks

- ✅ No middleware changes → no redirect loop risk
- ✅ No auth changes → no bootstrap gap risk
- ✅ No RLS changes → no access leak risk
- ✅ No Stripe changes → no payment flow risk

---

## IMPLEMENTATION DETAILS

### A) Canonical Categories Module (Single Source of Truth)

**Create:** `lib/constants/gig-categories.ts`

**Purpose:** Prevent category drift across 9+ files. Single source of truth for all category logic.

**Exports:**
```typescript
export const GIG_CATEGORIES = [
  "modeling",
  "acting", 
  "photography",
  "video",
  "influencer",
  "dancer",
  "musician",
] as const;

export type GigCategory = typeof GIG_CATEGORIES[number];

export const LEGACY_CATEGORY_MAP: Record<string, GigCategory> = {
  // Modeling-specific → modeling
  editorial: "modeling",
  commercial: "modeling",
  runway: "modeling",
  print: "modeling",
  fitness: "modeling",
  beauty: "modeling",
  // Promotional/e-commerce → influencer (closer intent than modeling)
  promotional: "influencer",
  "e-commerce": "influencer",
  // Generic fallback
  other: "modeling",
};

export function normalizeGigCategory(category: string): GigCategory {
  // If already a new category, return as-is
  if (GIG_CATEGORIES.includes(category as GigCategory)) {
    return category as GigCategory;
  }
  // Map legacy categories
  return LEGACY_CATEGORY_MAP[category] || "modeling";
}

export function getCategoryLabel(category: string): string {
  const normalized = normalizeGigCategory(category);
  const labels: Record<GigCategory, string> = {
    modeling: "Modeling",
    acting: "Acting",
    photography: "Photography",
    video: "Video",
    influencer: "Influencer",
    dancer: "Dancer",
    musician: "Musician",
  };
  return labels[normalized];
}

export function getCategoryBadgeVariant(category: string): string {
  const normalized = normalizeGigCategory(category);
  // Return Tailwind classes or variant name for badge styling
  const variants: Record<GigCategory, string> = {
    modeling: "bg-purple-100 text-purple-800",
    acting: "bg-blue-100 text-blue-800",
    photography: "bg-gray-100 text-gray-800",
    video: "bg-red-100 text-red-800",
    influencer: "bg-pink-100 text-pink-800",
    dancer: "bg-yellow-100 text-yellow-800",
    musician: "bg-green-100 text-green-800",
  };
  return variants[normalized];
}
```

**Usage:** All UI components import from this module instead of hardcoding categories.

### New Gig Categories

**Replace:**
- editorial, commercial, runway, print, fitness, beauty, promotional, e-commerce, other

**With:**
- modeling
- acting
- photography
- video
- influencer
- dancer
- musician

**Backward Compatibility:**
- **Display:** Use `normalizeGigCategory()` to show normalized labels
- **Filtering:** Server-side queries must include legacy categories when filtering by new category:
  ```sql
  -- When filtering for "modeling", include legacy categories
  WHERE category IN ('modeling', 'editorial', 'commercial', 'runway', 'print', 'fitness', 'beauty')
  ```
- **Mapping:**
  - editorial, commercial, runway, print, fitness, beauty → modeling
  - promotional, e-commerce → influencer (closer intent)
  - other → modeling (fallback)

### Conditional Profile Fields Logic

**Modeling-Specific Fields (show only for modeling talent):**
- `shoe_size`
- `height`
- `measurements`
- `hair_color`
- `eye_color`

**Universal Fields (show for all talent):**
- `phone`
- `age`
- `location`
- `experience`
- `portfolio_url`
- `languages`
- `specialties`

**Talent Type Detection:**
- **Option A (RECOMMENDED):** Check if `talent_profiles.specialties` array includes "modeling" or modeling-related terms
  - **VERIFIED:** `specialties` exists as `text[]` in database schema
  - Create utility: `lib/utils/talent-type.ts` with `isModelingTalent(specialties: string[] | null): boolean`
- **Option B (Fallback):** Add optional `primary_category` text field to `talent_profiles` table (nullable, defaults to null)
  - Only needed if specialties-based detection is insufficient

### B) PATCH-Style Profile Updates (Prevent Data Wiping)

**CRITICAL:** Current `updateTalentPersonalInfoAction` does full `.update()` with all fields. If hidden fields are submitted as null/empty, existing data gets wiped.

**Solution:** Modify form submission to omit hidden fields from payload, and update server action to only update fields present in payload.

**Form Changes:**
- When fields are hidden, do NOT include them in form submission
- Only submit fields that are visible/editable

**Server Action Changes:**
- Update `lib/actions/profile-actions.ts` → `updateTalentPersonalInfoAction`
- Only include fields in update payload if they are present (not undefined)
- Use conditional object construction:
  ```typescript
  const talentPatch: TalentProfilesUpdate = {
    phone: parsed.data.phone,
    age: parsed.data.age,
    location: parsed.data.location,
    updated_at: new Date().toISOString(),
    // Only include modeling fields if they exist in payload
    ...(parsed.data.height !== undefined && { height: parsed.data.height }),
    ...(parsed.data.measurements !== undefined && { measurements: parsed.data.measurements }),
    ...(parsed.data.hair_color !== undefined && { hair_color: parsed.data.hair_color }),
    ...(parsed.data.eye_color !== undefined && { eye_color: parsed.data.eye_color }),
    ...(parsed.data.shoe_size !== undefined && { shoe_size: parsed.data.shoe_size }),
  };
  ```

### Files Requiring Changes

**Phase 1 - Category Updates:**

**New File:**
1. `lib/constants/gig-categories.ts` - **CREATE** canonical categories module

**Category Dropdowns (Update to use canonical module):**
2. `app/post-gig/page.tsx` - Lines 172-180
3. `app/admin/gigs/create/create-gig-form.tsx` - Lines 125-132
4. `app/client/apply/page.tsx` - Lines 336-337 (if present)
5. `app/gigs/page.tsx` - Lines 264-268

**Category Badge/Display (Update to use canonical module):**
6. `app/client/dashboard/page.tsx` - Category badge mapping (lines 319-327)
7. `app/client/gigs/client.tsx` - Category badge mapping (lines 130-138)
8. `app/talent/dashboard/client.tsx` - Category badge mapping (lines 557-565)
9. `app/gigs/[id]/page.tsx` - Category badge colors (lines 88-92)
10. `app/gigs/[id]/apply/page.tsx` - Category badge colors (lines 72-76)

**Server-Side Filtering (Update queries to include legacy categories):**
11. `app/gigs/page.tsx` - Server-side category filter query
12. Any other server components that filter by category

**Phase 2 - Conditional Profile Fields:**

**New Files:**
1. `lib/utils/talent-type.ts` - **CREATE** utility to detect modeling talent from specialties

**Form Components (Add conditional rendering + omit hidden fields from submission):**
2. `components/forms/talent-personal-info-form.tsx` - Conditional rendering + omit hidden fields
3. `components/forms/talent-profile-form.tsx` - Conditional rendering + omit hidden fields
4. `app/settings/sections/talent-details.tsx` - Conditional rendering + omit hidden fields

**Server Actions (PATCH-style updates):**
5. `lib/actions/profile-actions.ts` - Update `updateTalentPersonalInfoAction` to only update present fields

---

## RECOMMENDED CANONICAL CATEGORIES

### Single Source of Truth List

**Gig Categories:**
- ✅ "modeling" (replaces: editorial, commercial, runway, print, fitness, beauty)
- ✅ "acting"
- ✅ "photography"
- ✅ "video"
- ✅ "influencer"
- ✅ "dancer"
- ✅ "musician"

**Avoid:**
- ❌ Old modeling-specific categories (editorial, commercial, runway, etc.)
- ❌ Generic "other" category (use specific categories instead)

---

## D) Product Documentation Updates

**Files to update after Phase 1:**
- `docs/TOTL_AGENCY_USER_GUIDE.md` - Update category references
- Any other user-facing documentation that mentions old categories

## E) "Don't Ship Broken" Pre-Push Checklist

**Before pushing, verify:**
1. ✅ Post a gig in each new category (modeling, acting, photography, video, influencer, dancer, musician)
2. ✅ Filter `/gigs` by each category - verify results include both new and legacy categories
3. ✅ Update a talent profile as modeling talent - verify modeling fields visible and save correctly
4. ✅ Update a talent profile as photography talent - verify modeling fields hidden AND existing modeling data NOT wiped
5. ✅ Verify category badges display correctly for both new and legacy categories
6. ✅ Run existing E2E tests - all should pass
7. ✅ Check server logs for any category validation errors

---

## NEXT STEPS

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

**Recommended:** Approach A (Category-Based Field Visibility with Option A - infer from specialties)

**Constraints:**
- Do not change database column names or constraints
- Do not change form field names (only visibility)
- Do not change server action signatures (but implement PATCH-style updates)
- Maintain backward compatibility for existing gigs/categories (display + filtering)
- **CRITICAL:** Prevent data wiping by omitting hidden fields from form submission

**Required Adjustments:**
- ✅ Create canonical categories module (`lib/constants/gig-categories.ts`)
- ✅ Implement PATCH-style profile updates (only update present fields)
- ✅ Update server-side filtering to include legacy categories
- ✅ Verify `specialties` field exists (confirmed: `text[]` in schema)
- ✅ Create talent type detection utility (`lib/utils/talent-type.ts`)
- ✅ Update product documentation after Phase 1

---

**RED ZONE INVOLVED:** NO

**Architectural Compliance:** ✅ All changes respect Airport Model (Terminal zone primary + minimal Staff zone for protective updates) and Architecture Constitution (UI changes + PATCH-style update protection)

---

## LANDMINE MITIGATION SUMMARY

### ✅ Landmine 1: Server-Side Validation
**Status:** Mitigated
- **Verified:** No Zod enum validation for categories (accepts `string`)
- **Action:** If any server-side category validation exists, update to accept new categories or use normalization function

### ✅ Landmine 2: Specialties Field Assumption
**Status:** Verified
- **Confirmed:** `talent_profiles.specialties` exists as `text[]` in database schema (line 163)
- **Action:** Use specialties array for talent type detection

### ✅ Landmine 3: Hidden Fields Data Wiping
**Status:** Mitigated
- **Problem:** Current `.update()` wipes existing data if hidden fields sent as null
- **Solution:** 
  - Omit hidden fields from form submission
  - Implement PATCH-style server action updates (only update present fields)
  - Add critical test: verify existing modeling data NOT wiped when non-modeling talent updates profile
