# TOTL Agency — UI Constitution

**Date:** February 26, 2026  
**Status:** Canonical UI governance ("laws")  
**Applies to:** Talent Terminal, Career Builder Terminal, Admin Terminal  
**Primary target viewport:** 390x844 (mobile-first)  
**Non-goal:** This document does NOT define visual style tokens (see `docs/features/UI_VISUAL_LANGUAGE.md`).

It defines UX contracts, responsive behavior, role-surface separation, and enforcement.

---

## 0) Purpose

We build fast, but we build coherent. This constitution prevents:
- mobile chrome bloat and wasted above-the-fold space,
- role-surface leakage (client patterns bleeding into admin/talent),
- UI fixes that secretly change auth/bootstrap/policy behavior,
- "quick" client reads in headers/nav that violate architecture rules.

This is the "what must remain true" document for UI.

---

## 1) Definitions

- **Terminal:** Role-specific user experience surface (`/talent/*`, `/client/*`, `/admin/*`).
- **Chrome:** Persistent UI framing (headers, nav bars, drawers, toolbars).
- **Above-the-fold:** What the user sees at first paint on 390x844 without scrolling.
- **Role-Surface Leakage:** When a shared component change causes another role's UX or controls to change unintentionally.
- **Bootstrap-safe state:** The app can render safely when profile data is missing/loading.

---

## 2) Non-Negotiable Laws (Architecture-aligned)

1. **UI stays in Terminal.**  
   Never solve layout, mobile nav, or density problems by changing middleware/auth/redirect logic.
2. **Auth identity != app identity.**  
   UI cannot assume "signed in" means "role-ready." Must respect profiles/role bootstrap patterns.
3. **Missing profile is valid.**  
   UI must render safe loading/empty states; no new UI-driven redirect loops.
4. **No new privileged reads in client chrome.**  
   Headers/nav/drawers must not introduce new Supabase reads for counts/badges/permissions.
5. **RLS is final authority.**  
   Hiding a menu item is UX only, never authorization.

---

## 3) Role Surfaces (Separation Rules)

1. **Each role terminal owns its chrome.**  
   Client chrome changes must not alter Admin/Talent chrome unless explicitly planned.
2. **Shared component edits require a role-surface audit.**  
   If you touch a shared nav/header component, you must document:
   - impacted routes,
   - which terminals reuse it,
   - screenshots per terminal at mobile width.
3. **No admin controls in non-admin terminals.**  
   Even if "hidden," no admin actions/components should ship inside client/talent bundles.

---

## 4) Mobile Above-the-Fold Budget (390x844)

1. **Chrome must be compact and safe-area aware.**
   - Mobile header target: ~56px content row (plus safe-area padding).
2. **No stacked headers.**
   - If a route introduces a local header, the global header must be suppressed for that route (layout-scoped, not middleware).
3. **First meaningful module must appear quickly.**
   - On 390x844, user should see: title + first real content module with minimal scroll.
4. **Action declutter is mandatory on mobile.**
   - Primary action(s) visible; secondary actions go to overflow or secondary surface.

---

## 5) Navigation Contract (Drawer / Menu)

If a drawer is used:

1. **True drawer behavior**
   - Backdrop dimming
   - Background becomes inert (no interaction)
   - Scroll lock while drawer is open
2. **Close behaviors are required**
   - Close button
   - Backdrop tap
   - Escape key
   - Route change
3. **Drawer is navigation, not a data dashboard**
   - No new fetching for badges/counts in drawer/header.
4. **Keyboard + focus**
   - Focus moves into drawer on open and returns to trigger on close.

---

## 6) Density Rules (Mobile-first)

1. **Touch targets >= 44px** for primary interactive elements.
2. **Cards are information-dense, not decorative.**
   - Reduce padding before removing clarity.
3. **One emphasis rule**
   - Max one chip/badge emphasis per summary card unless strongly justified.
4. **Stats on mobile are list-first**
   - Avoid 2-up "fat stat cards" on mobile.
   - Prefer a compact summary row or single-column stat list.
5. **No emoji in persistent labels**
   - Nav labels, stat labels, card titles: emoji-free.
6. **Prevent horizontal overflow**
   - Mobile views must not introduce sideways scroll.

---

## 7) Component Contracts (UI primitives)

These are behavioral contracts; visuals live in `docs/features/UI_VISUAL_LANGUAGE.md`.

### 7.1 Page Header
- Mobile: compact header + optional overflow menu
- Desktop: can expand but must remain consistent across terminal

### 7.2 Stats / KPI Blocks
- Desktop: grid allowed
- Mobile: list/summary adapter required (`DesktopStatsGrid` + `MobileStatsList`)

### 7.3 Tables
- Mobile: tables must degrade gracefully:
  - either horizontal scroll with clear affordance, OR
  - convert into stacked list-cards (preferred when actionable).

### 7.4 Empty / Zero States
- Must be compact, informative, and action-oriented.
- Must not "look broken" when counts are 0.

### 7.5 Loading States
- Use skeletons where layout stability matters (headers, stat blocks).
- No layout shift that pushes content down after load.

---

## 8) Change Review Requirements (Enforcement)

Every UI PR that touches chrome/density must include:

### Evidence
- [ ] Screenshots at **390x844** and **360x800** (or closest) for impacted routes
- [ ] Before/after comparison for above-the-fold
- [ ] Confirmation: no schema/policy/middleware/auth/bootstrap changes

### Tests (when interaction changes)
- [ ] Stable `data-testid` for: header root, drawer trigger, drawer panel, overflow trigger
- [ ] At least one automated check:
  - E2E drawer open/close + route change close, OR
  - Component test for header/drawer contract
- [ ] Overflow sentinel check: no horizontal scroll at mobile widths

### Waivers (rare)
If a law is intentionally broken, PR must include:
- **Waiver:** what law, why, and what will fix it later
- **Expiry:** a date/version milestone when waiver must be removed

---

## 9) Stop the Line Conditions (Fail the PR)

- UI change alters auth/redirect/bootstrap/policy behavior as a side-effect.
- Shared component change causes cross-role chrome changes without audit evidence.
- Mobile drawer/menu lacks inert backdrop + close contract.
- New client-side Supabase reads added to header/nav/drawer.
- Mobile introduces horizontal overflow or unusable touch targets.

---

## 10) Related Docs

- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/airport-model.md`
- `docs/diagrams/role-surfaces.md`
- `docs/features/UI_VISUAL_LANGUAGE.md`
- `docs/development/DASHBOARD_MOBILE_DENSITY_GUIDE.md`
