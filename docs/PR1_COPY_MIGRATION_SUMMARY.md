# PR1: Copy Migration — Tier A Safe Swaps

**Date:** December 21, 2025  
**Status:** ✅ COMPLETE  
**Purpose:** Replace modeling-specific language with generalized professional language in form labels, placeholders, and UI copy (Tier A safe swaps only).

---

## Summary

PR1 completes Tier A of the copy migration plan by replacing modeling-specific language with generalized professional language. All changes are copy-only (labels, placeholders, UI text) with no logic, database, or routing changes.

---

## Changes Made

### 1. Form Labels & Placeholders

**`components/forms/talent-professional-info-form.tsx`**
- ✅ Line 132: "Modeling Experience *" → "Professional Experience *"
- ✅ Line 136: "Tell us about your modeling experience..." → "Tell us about your professional experience..."
- ✅ Line 165: "List your modeling specialties..." → "List your professional specialties..."

**`components/forms/talent-profile-form.tsx`**
- ✅ Line 482: "Describe your modeling/acting experience..." → "Describe your professional experience..."

### 2. Onboarding & Entry Points

**`app/choose-role/page.tsx`**
- ✅ Line 105: "Apply to exclusive modeling opportunities" → "Apply to exclusive opportunities"
- ✅ Line 151: "Post modeling opportunities" → "Post opportunities"

### 3. Dashboard Copy

**`app/client/dashboard/page.tsx`**
- ✅ Line 976: "Post a new casting call or gig" → "Post a new opportunity or gig"
- ✅ Line 977: "qualified models, actors, and performers" → "qualified talent and professionals"

### 4. Gigs Page Copy

**`app/gigs/page.tsx`**
- ✅ Line 127: "casting opportunities" → "opportunities"
- ✅ Line 232: "casting opportunities" → "opportunities"

---

## Files Changed

1. `components/forms/talent-professional-info-form.tsx` — Form labels and placeholders (3 replacements)
2. `components/forms/talent-profile-form.tsx` — Form placeholder (1 replacement)
3. `app/choose-role/page.tsx` — Role selection bullet points (2 replacements)
4. `app/client/dashboard/page.tsx` — Empty state description (2 replacements)
5. `app/gigs/page.tsx` — Page descriptions (2 replacements)

**Total:** 5 files, 10 replacements

---

## Verification

### Build & Lint
- ✅ `npm run build` — PASSED (57 pages compiled successfully)
- ✅ `npm run lint` — PASSED (no ESLint warnings or errors)

### Proof Hooks (Verification Commands)

```bash
# Verify no "modeling experience" labels remain
grep -r "Modeling Experience" components/forms/
# Result: ✅ No matches

# Verify no "modeling opportunities" remain
grep -r "modeling opportunities" app/
# Result: ✅ No matches

# Verify no "casting call" remain
grep -r "casting call" app/
# Result: ✅ No matches (except in comments/context where appropriate)

# Verify no "casting opportunities" remain
grep -r "casting opportunities" app/
# Result: ✅ No matches
```

### Manual Verification Checklist

**Form Components:**
- ✅ Talent professional info form shows "Professional Experience" label
- ✅ Placeholder text uses "professional experience" language
- ✅ Specialties placeholder uses "professional specialties"
- ✅ Talent profile form placeholder uses "professional experience"

**Onboarding Flow:**
- ✅ Choose-role page talent card shows "Apply to exclusive opportunities"
- ✅ Choose-role page client card shows "Post opportunities"

**Dashboards:**
- ✅ Client dashboard empty state uses "opportunity or gig" language
- ✅ Client dashboard describes "talent and professionals"

**Gigs Page:**
- ✅ Gigs page descriptions use "opportunities" not "casting opportunities"

---

## Policy Matrix Alignment

All changes align with `docs/COPY_MIGRATION_PLAN.md`:

- ✅ Tier A safe swaps only (no product meaning changes)
- ✅ No database field names changed
- ✅ No form field names changed (only labels/placeholders)
- ✅ No routing or access logic changed
- ✅ No new capabilities implied

---

## Risk Assessment

**Risk Level:** Low

**Why:**
- Copy-only changes (no logic modifications)
- No database schema changes
- No routing or middleware changes
- No form field names changed (only labels/placeholders)
- All changes are reversible

**Rollback Plan:**
- Revert changes to 5 files listed above
- No database migrations or schema changes to roll back

---

## Architectural Compliance

**Constitution Invariants Respected:**
- ✅ No DB calls in client components — copy-only changes
- ✅ All mutations are server-side — no mutation changes
- ✅ RLS is final authority — no access rule changes
- ✅ Missing profile is valid bootstrap state — no onboarding logic changes
- ✅ No `select('*')` — no query changes

**Airport Zones Touched:**
- **Terminal Zone:** UI copy only (where copy changes occur)

**RED ZONE INVOLVED:** NO

---

## Acceptance Criteria Met

**PR1 Definition of Done:**
- ✅ No UI label says "modeling experience" (or equivalents)
- ✅ No CTA implies browsing/searching talent (unchanged from PR1-5)
- ✅ No logic changed (diff is copy-only)
- ✅ Build + lint pass clean

---

## Next Steps

1. ✅ PR1 Complete — Tier A safe swaps (copy-only changes)
2. **PR2:** Tier B product framing (homepage hero, onboarding narrative, dashboard empty states)
3. **PR3:** Tier C platform positioning (marketing pages, platform description)

---

**RED ZONE INVOLVED:** NO

**Architectural Compliance:** ✅ All changes respect Airport Model (Terminal zone only) and Architecture Constitution (copy-only, no logic changes)

