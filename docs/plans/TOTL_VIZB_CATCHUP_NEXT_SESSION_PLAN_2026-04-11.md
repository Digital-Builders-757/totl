# TOTL → ViZB Catch-Up Plan (Next Session)

**Date:** April 11, 2026  
**Purpose:** Give the next Cursor session a ranked, practical visual catch-up plan so TOTL keeps closing the quality gap with ViZB.

---

## Current grade

**Overall:** B+ / 8.2 out of 10

### Breakdown
- **Marketing / first impression:** A-
- **Shared visual system:** A-
- **Main authenticated flows:** B+
- **Long-tail admin/detail/loading states:** B / B-
- **Whole-product consistency:** B+

---

## What we already did right

### 1) Built a real design system, not isolated page makeovers
TOTL now has a coherent visual foundation:
- `PageShell`
- `TotlAtmosphereShell`
- `TotlSectionDivider`
- `panel-frosted`
- `card-backlit`
- `button-glow`
- OKLCH text tokens / input styling / lifted ambient shells

### 2) Upgraded the highest-signal surfaces first
Recent work moved the product in the right order:
- Homepage and shared visual primitives
- About / legal / auth-entry / onboarding surfaces
- Admin users and admin gigs terminals
- Client application lookup + success flows
- Client applications terminal and help/loading states
- Homepage featured opportunities + dynamic data hardening

### 3) Improved product semantics, not just cosmetics
Good catch-up work already included:
- safer destructive actions
- clearer lifecycle states
- stronger empty states and success states
- better mobile guardrails and responsive selectors
- more role-correct terminal behavior

---

## What still makes TOTL feel behind ViZB

The gap is no longer “big redesign needed.”

The remaining gap is mostly:
- **consistency debt**
- **older gray-heavy secondary routes**
- **detail / help / loading states that still feel like old TOTL**
- **a few utility screens that haven’t fully adopted the premium shell language**

---

## Ranked next-session punchlist

## P0 — Highest impact, do these first

### Batch 1: Client bookings terminal catch-up
**Why first:** This is a core business surface. If bookings still looks older than applications/gigs, the premium feel breaks.

**Primary targets**
- `app/client/bookings/client-bookings-client.tsx`
- `app/client/bookings/components/bookings-results-content.tsx`
- `app/client/bookings/components/bookings-stats-overview.tsx`

**Goal**
- Match the newer lifted / frosted / tokenized language already used in client applications.
- Remove remaining heavy `gray-*` shell styling.
- Tighten stats, filters, cards, empty states, and mobile tabs.

---

### Batch 2: Admin applications surfaces
**Why second:** These are long-tail admin routes that still make the product feel uneven.

**Primary targets**
- `app/admin/applications/admin-applications-client.tsx`
- `app/admin/applications/[id]/admin-application-detail-client.tsx`

**Goal**
- Bring lists, tables, dialogs, metadata labels, detail cards, and action areas onto the same frosted admin language as admin users / admin gigs.

---

### Batch 3: Admin client-applications terminal
**Why third:** Large admin surface with obvious remaining gray-heavy debt.

**Primary target**
- `app/admin/client-applications/admin-client-applications-client.tsx`

**Goal**
- Convert filters, tabs, dialogs, detail overlays, tables, and action menus to the current token + glass system.

---

## P1 — Finish consistency debt

### Batch 4: Admin gig detail / success states
**Targets**
- `app/admin/gigs/[id]/admin-gig-detail-client.tsx`
- `app/admin/gigs/success/page.tsx`

**Goal**
- Make detail and success states feel as premium as the list/create surfaces.

### Batch 5: Settings / loading cleanup
**Targets**
- `settings/sections/client-details.tsx`
- `app/talent/settings/billing/loading.tsx`
- `components/admin/admin-loading-shell.tsx`

**Goal**
- Remove the last obvious “old TOTL” pockets from settings and loading shells.

---

## Rules for the next session

### Keep doing this
- Prefer **minimal diffs**.
- Reuse existing primitives.
- Keep role-scoped navigation clean.
- Use token-based text contrast instead of ad hoc `text-gray-*`.
- Make empty states have **one clear next action**.
- Keep mobile rails, tab lists, and action buttons safe and non-overflowing.

### Do not do this
- Do **not** add a new UI library.
- Do **not** redesign the information architecture unless needed.
- Do **not** create a separate visual language per route.
- Do **not** chase cleverness over consistency.

---

## Acceptance criteria for each batch

A batch is only “done” if it meets all of these:
- Header / above-the-fold spacing feels intentional
- No horizontal overflow on mobile
- Section headings use a consistent scale
- Buttons are comfortable on mobile (44px+ feel)
- Filters / tabs / dropdowns match the current shell language
- Empty states have a clear action
- No obvious fallback to older gray-heavy cards/dialogs
- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes for substantial batches

---

## Recommended session order tonight

If time is limited:
1. **Client bookings**
2. **Admin applications list + detail**
3. **Admin client-applications**

If there is extra time afterward:
4. **Admin gig detail / success**
5. **Settings + loading cleanup**

---

## Cursor kickoff prompt

Use this to start the next session fast:

```text
Stay focused on TOTL only.

Goal: continue the ViZB catch-up visual polish with minimal diffs, reusing the existing TOTL glass / lifted / OKLCH design system.

Start with the highest-impact remaining surfaces:
1. app/client/bookings/client-bookings-client.tsx
2. app/client/bookings/components/bookings-results-content.tsx
3. app/client/bookings/components/bookings-stats-overview.tsx
4. app/admin/applications/admin-applications-client.tsx
5. app/admin/applications/[id]/admin-application-detail-client.tsx
6. app/admin/client-applications/admin-client-applications-client.tsx

Rules:
- no new UI libraries
- reuse existing primitives
- prefer minimal diffs
- remove remaining gray-heavy styling
- improve tabs / filters / dialogs / detail cards / empty states / mobile rails
- keep role-scoped behavior intact

Done means:
- no mobile overflow
- one clear next action in empty states
- tokenized text contrast
- frosted/glass consistency
- npm run typecheck
- npm run lint
- npm run build for substantial batches

Commit cleanly in logical batches.
```

---

## Target outcome

If the P0 items above land cleanly, TOTL should move from **B+** to roughly **A- feeling**, with the remaining gap to ViZB becoming mostly premium finish and long-tail refinement rather than structural inconsistency.
