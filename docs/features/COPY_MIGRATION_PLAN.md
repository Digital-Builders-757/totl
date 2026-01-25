# Copy Migration Plan: Modeling → Professional Talent Platform

**Date:** December 21, 2025  
**Status:** 📋 PLAN COMPLETE (Ready for Implementation)  
**Purpose:** Systematically migrate copy from modeling-specific language to broader professional talent + events/services platform language.

---

## Executive Summary

**Goal:** Identify and propose copy changes to reflect that TOTL is not only a model agency platform, but also a broader professional talent + events/services platform.

**Approach:** Tiered, low-risk migration across 3 PRs:
- **PR1:** Safe label swaps (no product meaning change)
- **PR2:** Product framing updates (key entrypoints)
- **PR3:** Platform positioning (marketing pages + nav)

**Risk Level:** Low (copy-only changes, no logic/DB changes)

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` — No violations (copy-only changes)
- ✅ `docs/POLICY_MATRIX_APPROACH_B.md` — Copy must align with "no directory" policy
- ✅ `database_schema_audit.md` — No schema changes needed
- ✅ `docs/diagrams/airport-model.md` — Terminal zone only (UI copy)

### Diagrams Used
- **Terminal Zone** (`docs/diagrams/role-surfaces.md`) — UI pages and components where copy appears
- **No other diagrams needed** — This is a pure UI/copy change

---

## STEP 1 — CONSTITUTION INVARIANTS

### 5 Most Relevant Non-Negotiables

1. **"No DB calls in client components"**
   - **How it limits:** Copy changes must not introduce new data fetching logic. Only string replacements.

2. **"All mutations are server-side"**
   - **How it limits:** Copy changes must not affect form submission logic or server actions.

3. **"RLS is final authority"**
   - **How it limits:** Copy changes must not imply access changes. Access rules remain unchanged.

4. **"Missing profile is a valid bootstrap state"**
   - **How it limits:** Onboarding copy changes must not break bootstrap flow or redirect logic.

5. **"No `select('*')`"**
   - **How it limits:** Copy changes must not affect query patterns or column selection.

**RED ZONE INVOLVED:** NO

**Rationale:** Copy-only changes do not touch middleware, auth callbacks, profile bootstrap, Stripe webhooks, or RLS policies.

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones Touched

**Terminal Zone (UI Pages & Components)** ✅
- **Why:** All copy changes occur in UI components, pages, and forms
- **What stays OUT:** No business logic changes, no data fetching changes, no routing changes

### Zones NOT Touched

- **Security Zone:** No middleware/routing changes
- **Staff Zone:** No server actions/API route changes
- **Ticketing Zone:** No Stripe/billing copy changes (unless explicitly identified)
- **Locks Zone:** No RLS/DB constraint changes
- **Control Tower:** No admin tool copy changes (unless explicitly identified)

**Zone Violations to Avoid:**
- ❌ Do not change form field names that map to database columns
- ❌ Do not change route paths or constants
- ❌ Do not change error messages that affect business logic

---

## STEP 3 — DESIGN PROPOSALS

### Approach A: Tiered Migration (RECOMMENDED)

**High-level description:**
Three-tier migration strategy with increasing scope and risk:
- **Tier A:** Safe label swaps (e.g., "modeling experience" → "professional experience")
- **Tier B:** Product framing (e.g., "casting calls" → "opportunities")
- **Tier C:** Platform positioning (e.g., mention events + production services)

**Files expected to change:**

**PR1 (Tier A - Safe Swaps):**
- `components/forms/talent-professional-info-form.tsx` (labels, placeholders)
- `components/forms/talent-profile-form.tsx` (placeholders)
- `app/choose-role/page.tsx` (bullet points)
- `app/client/dashboard/page.tsx` (descriptions)
- `app/gigs/page.tsx` (descriptions)

**PR2 (Tier B - Product Framing):**
- `app/page.tsx` (hero copy, CTAs)
- `app/choose-role/page.tsx` (role descriptions)
- `components/auth/sign-in-gate.tsx` (descriptions)
- `app/client/dashboard/page.tsx` (empty states, CTAs)

**PR3 (Tier C - Platform Positioning):**
- `app/talent/page.tsx` (marketing copy - already partially done)
- `app/about/page.tsx` (if exists)
- `components/navbar.tsx` (nav labels if needed)
- `app/page.tsx` (footer, platform description)

**Data model impact:** None (copy-only changes)

**Key risks:**
- **Redirect loops:** None (no routing changes)
- **Profile bootstrap gaps:** None (no onboarding logic changes)
- **RLS enforcement:** None (no access rule changes)
- **Stripe/webhook idempotency:** None (no payment flow changes)

**Why this approach respects:**
- ✅ **Constitution:** No violations (copy-only)
- ✅ **Airport boundaries:** Terminal zone only
- ✅ **Selected diagrams:** Role surfaces (UI copy)

---

### Approach B: Single PR Migration (NOT RECOMMENDED)

**High-level description:**
Change all copy in one PR.

**Why NOT recommended:**
- High blast radius (harder to review)
- Higher risk of missing edge cases
- Difficult to roll back if issues found
- No incremental validation

---

### Approach C: Database-Driven Copy (NOT RECOMMENDED)

**High-level description:**
Store copy in database and fetch dynamically.

**Why NOT recommended:**
- Violates "no DB calls in client components" for simple strings
- Adds unnecessary complexity
- Harder to version control
- Performance overhead for static copy

---

## STEP 4 — ACCEPTANCE CRITERIA

### UI Behavior

**PR1 (Tier A):**
- ✅ All form labels use "professional experience" instead of "modeling experience"
- ✅ All placeholders use generalized language
- ✅ No references to "modeling opportunities" in key entrypoints

**PR2 (Tier B):**
- ✅ Homepage hero describes platform as "professional talent + opportunities"
- ✅ Onboarding describes "opportunities" not "casting calls"
- ✅ Dashboards use "opportunities" or "bookings" terminology

**PR3 (Tier C):**
- ✅ Marketing pages mention events + production services
- ✅ Platform positioning clearly states multi-industry support
- ✅ Nav labels (if changed) reflect broader platform

### Data Correctness

- ✅ No form field names changed (only labels/placeholders)
- ✅ No database column names affected
- ✅ No enum values changed

### Permissions & Access Control

- ✅ No access rules changed
- ✅ No RLS policies affected
- ✅ No middleware logic changed

### Failure Cases (What Must NOT Happen)

- ❌ Form submissions break due to changed field names
- ❌ Database queries fail due to changed column references
- ❌ Onboarding flow breaks due to changed copy
- ❌ Access rules accidentally changed via copy updates

---

## STEP 5 — TEST PLAN

### Manual Test Steps

**PR1 (Tier A):**
1. ✅ Navigate to talent signup form
2. ✅ Verify "Modeling Experience" label changed to "Professional Experience"
3. ✅ Verify placeholder text uses generalized language
4. ✅ Submit form and verify no errors
5. ✅ Navigate to choose-role page
6. ✅ Verify bullet points use generalized language

**PR2 (Tier B):**
1. ✅ Navigate to homepage (signed-out)
2. ✅ Verify hero copy describes "professional talent + opportunities"
3. ✅ Navigate to choose-role page
4. ✅ Verify role descriptions use "opportunities" not "casting calls"
5. ✅ Sign in as talent
6. ✅ Navigate to gigs page
7. ✅ Verify descriptions use "opportunities" terminology

**PR3 (Tier C):**
1. ✅ Navigate to `/talent` marketing page
2. ✅ Verify copy mentions events + production services
3. ✅ Navigate to homepage footer
4. ✅ Verify platform description reflects multi-industry support

### Automated Tests

- ✅ No new automated tests needed (copy-only changes)
- ✅ Existing E2E tests should continue to pass (no logic changes)

### RED ZONE Regression Checks

- ✅ No middleware changes → no redirect loop risk
- ✅ No auth changes → no bootstrap gap risk
- ✅ No RLS changes → no access leak risk
- ✅ No Stripe changes → no payment flow risk

---

## COPY MIGRATION MAP

### Tier A: Safe Swaps (PR1)

| Current Phrase | Proposed Phrase | File Path(s) | Line Hint | Risk Level |
|---------------|-----------------|--------------|-----------|------------|
| "Modeling Experience" | "Professional Experience" | `components/forms/talent-professional-info-form.tsx` | ~132 | Low |
| "modeling experience" (placeholder) | "professional experience" | `components/forms/talent-professional-info-form.tsx` | ~136 | Low |
| "modeling specialties" | "professional specialties" | `components/forms/talent-professional-info-form.tsx` | ~165 | Low |
| "modeling/acting experience" | "professional experience" | `components/forms/talent-profile-form.tsx` | ~482 | Low |
| "Apply to exclusive modeling opportunities" | "Apply to exclusive opportunities" | `app/choose-role/page.tsx` | ~105 | Low |
| "Post modeling opportunities" | "Post opportunities" | `app/choose-role/page.tsx` | ~151 | Low |
| "casting call or gig" | "opportunity or gig" | `app/client/dashboard/page.tsx` | ~976 | Low |
| "casting opportunities" | "opportunities" | `app/gigs/page.tsx` | ~127, ~232 | Low |
| "models, actors, and performers" | "talent and professionals" | `app/client/dashboard/page.tsx` | ~977 | Low |

### Tier B: Product Framing (PR2)

| Current Phrase | Proposed Phrase | File Path(s) | Line Hint | Risk Level |
|---------------|-----------------|--------------|-----------|------------|
| "From models to influencers" | "From models to influencers, creatives, event staff, and production professionals" | `app/page.tsx` | ~50 | Medium |
| "professional models and actors" | "professional talent across industries" | `components/auth/sign-in-gate.tsx` | ~31 | Medium |
| "casting directors/brands" | "career builders, brands, and event organizers" | `AGENT_ONBOARDING.md` | ~27 | Medium |
| "models/actors" | "talent and professionals" | `AGENT_ONBOARDING.md` | ~30 | Medium |
| "casting call" | "opportunity" | `app/client/dashboard/page.tsx` | ~976 | Medium |

### Tier C: Platform Positioning (PR3)

| Current Phrase | Proposed Phrase | File Path(s) | Line Hint | Risk Level |
|---------------|-----------------|--------------|-----------|------------|
| "model agency platform" | "professional talent + opportunities platform" | `app/talent/page.tsx` | Already updated | Low |
| "TOTL Agency" (in contexts implying modeling-only) | "TOTL" or "TOTL Agency" (with broader context) | Multiple | Various | Low |
| Platform description (homepage footer) | Add mention of events + production services | `app/page.tsx` | Footer section | Low |

---

## RECOMMENDED CANONICAL PHRASES

### Single Source of Truth List

**Experience/Background:**
- ✅ "Professional experience" (not "modeling experience")
- ✅ "Professional specialties" (not "modeling specialties")
- ✅ "Work history" or "professional background" (not "modeling background")

**Opportunities/Gigs:**
- ✅ "Opportunities" (not "casting calls" or "casting opportunities")
- ✅ "Gigs" (acceptable, already generic)
- ✅ "Bookings" (acceptable, already generic)

**Talent/People:**
- ✅ "Talent" (acceptable, already generic)
- ✅ "Professionals" (when referring to broader categories)
- ✅ "Talent and professionals" (when emphasizing diversity)

**Platform Description:**
- ✅ "Professional talent + opportunities platform"
- ✅ "Talent booking platform for real-world work"
- ✅ "Platform connecting professionals to vetted opportunities"

**Industries (when listing):**
- ✅ "Models & performers, creatives, event staff, production professionals, and emerging roles"
- ✅ "Fashion, media, events, production, and emerging industries"

**Avoid:**
- ❌ "Model agency" (unless specifically referring to modeling vertical)
- ❌ "Casting calls" (use "opportunities")
- ❌ "Modeling opportunities" (use "opportunities" or "professional opportunities")

---

## 10 HIGH-IMPACT COPY EDITS

### Priority Order (Highest Impact First)

1. **Homepage Hero (`app/page.tsx` line ~50)**
   - Current: "From models to influencers, find the perfect match for your next project."
   - Proposed: "From models to influencers, creatives, event staff, and production professionals—find the perfect match for your next project."
   - Impact: First impression, highest visibility

2. **Talent Signup Form Label (`components/forms/talent-professional-info-form.tsx` line ~132)**
   - Current: "Modeling Experience *"
   - Proposed: "Professional Experience *"
   - Impact: Core onboarding flow, sets expectation

3. **Choose Role Page - Talent Card (`app/choose-role/page.tsx` line ~105)**
   - Current: "Apply to exclusive modeling opportunities"
   - Proposed: "Apply to exclusive opportunities"
   - Impact: Key entrypoint, sets platform scope

4. **Choose Role Page - Client Card (`app/choose-role/page.tsx` line ~151)**
   - Current: "Post modeling opportunities"
   - Proposed: "Post opportunities"
   - Impact: Key entrypoint, sets platform scope

5. **Sign-In Gate Description (`components/auth/sign-in-gate.tsx` line ~31)**
   - Current: "Access our exclusive network of professional models and actors."
   - Proposed: "Access our exclusive network of professional talent across industries."
   - Impact: Gate messaging, sets expectations

6. **Client Dashboard Empty State (`app/client/dashboard/page.tsx` line ~976)**
   - Current: "Post a new casting call or gig to find the perfect talent for your project. Our platform connects you with qualified models, actors, and performers."
   - Proposed: "Post a new opportunity or gig to find the perfect talent for your project. Our platform connects you with qualified professionals across industries."
   - Impact: Core client workflow, sets platform scope

7. **Gigs Page Description (`app/gigs/page.tsx` lines ~127, ~232)**
   - Current: "Browse through available casting opportunities and gigs."
   - Proposed: "Browse through available opportunities and gigs."
   - Impact: Core talent workflow, sets platform scope

8. **Talent Profile Form Placeholder (`components/forms/talent-profile-form.tsx` line ~482)**
   - Current: "Describe your modeling/acting experience..."
   - Proposed: "Describe your professional experience..."
   - Impact: Profile creation, sets expectation

9. **Talent Professional Info Form Placeholder (`components/forms/talent-professional-info-form.tsx` line ~136)**
   - Current: "Tell us about your modeling experience, previous work, and any specialties"
   - Proposed: "Tell us about your professional experience, previous work, and any specialties"
   - Impact: Onboarding flow, sets expectation

10. **Agent Onboarding Doc (`AGENT_ONBOARDING.md` line ~27)**
    - Current: "connecting models/actors with casting directors/brands"
    - Proposed: "connecting talent and professionals with career builders, brands, and event organizers"
    - Impact: Developer onboarding, sets platform understanding

---

## MINIMAL PR PLAN

### PR1: Tier A Safe Swaps (Low Risk)

**Scope:**
- Form labels and placeholders only
- No product meaning changes
- No database field names affected

**Files:**
- `components/forms/talent-professional-info-form.tsx`
- `components/forms/talent-profile-form.tsx`
- `app/choose-role/page.tsx` (bullet points only)
- `app/client/dashboard/page.tsx` (descriptions only)
- `app/gigs/page.tsx` (descriptions only)

**Acceptance Criteria:**
- ✅ All "modeling experience" → "professional experience"
- ✅ All "casting opportunities" → "opportunities"
- ✅ Forms still submit correctly
- ✅ No database errors

**Risk Level:** Low

---

### PR2: Tier B Product Framing (Medium Risk)

**Scope:**
- Key entrypoints (homepage, onboarding, dashboards)
- Product framing language
- No access/logic changes

**Files:**
- `app/page.tsx` (hero copy)
- `app/choose-role/page.tsx` (role descriptions)
- `components/auth/sign-in-gate.tsx` (descriptions)
- `app/client/dashboard/page.tsx` (empty states, CTAs)

**Acceptance Criteria:**
- ✅ Homepage describes broader platform
- ✅ Onboarding uses "opportunities" terminology
- ✅ Dashboards use generalized language
- ✅ No redirect loops or access issues

**Risk Level:** Medium (affects user expectations)

---

### PR3: Tier C Platform Positioning (Low Risk)

**Scope:**
- Marketing pages
- Platform description
- Nav labels (if needed)

**Files:**
- `app/talent/page.tsx` (already partially done)
- `app/page.tsx` (footer)
- `components/navbar.tsx` (if nav labels need updates)
- `AGENT_ONBOARDING.md` (developer docs)

**Acceptance Criteria:**
- ✅ Marketing pages mention events + production services
- ✅ Platform description reflects multi-industry support
- ✅ No broken links or navigation issues

**Risk Level:** Low

---

## NEXT STEPS

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

**Recommended:** Approach A (Tiered Migration)

**Constraints:**
- Do not change database column names or enum values
- Do not change form field names (only labels/placeholders)
- Do not change route paths or constants
- Do not change error messages that affect business logic

**Adjustments:**
- Consider adding a `docs/COPY_CANON.md` file to track canonical phrases
- Consider adding copy review checklist to pre-push checks (optional)

---

**RED ZONE INVOLVED:** NO

**Architectural Compliance:** ✅ All changes respect Airport Model (Terminal zone only) and Architecture Constitution (copy-only, no logic changes)

