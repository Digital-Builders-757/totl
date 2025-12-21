# Approach B Implementation Guide

**Date:** December 21, 2025  
**Status:** 🚧 IN PROGRESS (PR1 Complete)  
**Purpose:** Track implementation of Approach B (Hybrid) policy matrix across PR sequence.

---

## Policy Summary

**Approach B (Hybrid):**
- ✅ Public, intentional talent marketing profiles at `/talent/[slug]` (no sensitive fields)
- ❌ No talent directory exists (`/talent` removed/redirected)
- ✅ Clients see talent only through relationships (Applicants/Bookings)
- ✅ Gigs: list requires sign-in (G1), detail pages public for active gigs

**Reference:** `docs/POLICY_MATRIX_APPROACH_B.md` (canonical source of truth)

---

## PR Sequence Status

### ✅ PR1: Truthful UI Surfaces (COMPLETE)

**Goal:** Stop interface from advertising directories or "browse all."

**Changes Made:**

1. **Navbar (`components/navbar.tsx`)**
   - Removed "Talent" directory link (desktop + mobile)
   - Removed "Gigs" link for signed-out users (G1: list requires sign-in)
   - Kept "Gigs" link for signed-in users only

2. **Homepage (`app/page.tsx`)**
   - Removed "Browse Talent" hero CTA (no directory exists)
   - Removed "Browse Talent" footer CTA
   - Removed "Find Gigs" footer link (G1: list requires sign-in)
   - Kept "Start Booking" CTA (role-safe)

3. **Command Palette (`components/command-palette.tsx`)**
   - Changed "Browse Gigs" to "Sign in to Browse Gigs" for signed-out users
   - Kept "Browse Gigs" for signed-in users

4. **Admin Labels**
   - Renamed "View Talent Portal" → "Public Site View" (`components/admin/admin-header.tsx`, `app/admin/dashboard/admin-dashboard-client.tsx`)

5. **Demo Pages**
   - Removed "Browse Talent" and "Browse Gigs" cards from `/project-overview` (internal demo page)
   - Removed `/talent` link from `/ui-showcase` navigation
   - Updated demo CTA in `app/ui-showcase/animated-paths/page.tsx` to point to home

**Files Changed:**
- `components/navbar.tsx`
- `app/page.tsx`
- `components/command-palette.tsx`
- `components/admin/admin-header.tsx`
- `app/admin/dashboard/admin-dashboard-client.tsx`
- `app/project-overview/page.tsx`
- `app/ui-showcase/page.tsx`
- `app/ui-showcase/animated-paths/page.tsx`
- `components/ui/background-paths.tsx`

**Documentation Created:**
- `docs/POLICY_MATRIX_APPROACH_B.md` - Canonical policy matrix
- `docs/APPROACH_B_IMPLEMENTATION.md` - Implementation tracker
- `docs/PR1_SUMMARY.md` - PR1 summary and verification checklist

**Acceptance Criteria Met:**
- ✅ Signed-out users cannot be funneled into dead-end SignInGate flows via nav/footer/hero
- ✅ Copy reflects intent ("sign in required") instead of teasing browsing
- ✅ No "Browse Talent Directory" advertising anywhere
- ✅ Manual verification checklist completed (see `docs/PR1_SUMMARY.md`)

---

### 🚧 PR2: Control Plane Alignment (PENDING)

**Goal:** Make routing truth match policy matrix. No bypass by direct URL.

**Planned Changes:**
- Update `lib/constants/routes.ts` to remove `/talent` from public routes
- Update `middleware.ts` to redirect `/talent` (directory) away from SO/C
- Ensure `/talent/[slug]` remains public (marketing profiles)
- Align `/gigs` classification with G1 (list requires sign-in, detail public)

**Risk Level:** Medium (red zone - middleware/routing)

---

### 🚧 PR3: Locks + Data Shape (PENDING)

**Goal:** Make Approach B true at database + data layer.

**Planned Changes:**
- Ensure public marketing profile reads don't expose sensitive fields
- Enforce relationship-bound sensitive field access for clients
- Review/update RLS policies if needed

**Risk Level:** Medium (RLS changes)

---

### 🚧 PR4: Query Strategy Cleanup (PENDING)

**Goal:** Remove "directory behavior under the hood."

**Planned Changes:**
- Remove "fetch all talent_profiles then find slug" patterns
- Implement non-enumerating slug resolution
- Confirm no full-table reads for single profile requests

**Risk Level:** Low (query optimization)

---

## Testing Checklist

### PR1 Verification

- [ ] Signed-out: no "Talent" or "Gigs" links in header
- [ ] Signed-out: homepage has no "Browse Talent" CTA
- [ ] Signed-out: footer has no "Browse Talent" or "Find Gigs" links
- [ ] Signed-out: command palette shows "Sign in to Browse Gigs"
- [ ] Signed-in talent: "Gigs" link visible and functional
- [ ] Signed-in client: "Gigs" link visible and functional
- [ ] Admin: "Public Site View" label (not "Talent Portal")
- [ ] Demo pages: no links to `/talent` directory

---

## Related Documentation

- `docs/POLICY_MATRIX_APPROACH_B.md` - Canonical policy matrix
- `docs/CLIENT_TALENT_VISIBILITY.md` - Client visibility rules (must align)
- `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiable boundaries

