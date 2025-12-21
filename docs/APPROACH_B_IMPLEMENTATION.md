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

### ✅ PR2: Control Plane Alignment (COMPLETE)

**Goal:** Make routing truth match policy matrix. No bypass by direct URL.

**Changes Made:**

1. **Route Constants (`lib/constants/routes.ts`)**
   - Removed `PATHS.GIGS` and `PATHS.TALENT_LANDING` from `PUBLIC_ROUTES`
   - Removed `PUBLIC_ROUTE_PREFIXES` (too broad for Approach B + G1)
   - Rewrote `isPublicPath()` to explicitly allow only:
     - `/talent/[slug]` (exactly one segment after `/talent/`)
     - `/gigs/[id]` (exactly one segment after `/gigs/`)
   - Hard deny `/talent` directory and `/gigs` list
   - Hard deny `/gigs/[id]/apply` (talent-only)

2. **Middleware (`middleware.ts`)**
   - Added explicit handling for `/talent` directory:
     - Signed-out: redirect to `/`
     - Signed-in (all roles): redirect to appropriate dashboard
   - Added explicit handling for `/gigs` list:
     - Signed-out: redirect to `/login?returnUrl=/gigs`
     - Signed-in: allow (T/C/A can browse)
   - Preserved `/gigs/[id]` and `/talent/[slug]` as public (via `isPublicPath()`)
   - Preserved bootstrap safe routes (no redirect loops)

3. **Route Access Helpers (`lib/utils/route-access.ts`)**
   - Updated `needsTalentAccess()` to correctly identify public `/talent/[slug]` routes

**Files Changed:**
- `lib/constants/routes.ts`
- `middleware.ts`
- `lib/utils/route-access.ts`

**Acceptance Criteria Met:**
- ✅ Direct URL to `/talent` never shows roster (redirects away)
- ✅ Direct URL to `/gigs` as signed-out redirects to login
- ✅ Direct URL to `/gigs/[id]` as signed-out works (public gig detail)
- ✅ Direct URL to `/talent/[slug]` as signed-out works (public marketing profile)
- ✅ No redirect loops during bootstrap states
- ✅ All verification checks passed (schema, types, build, lint)

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

