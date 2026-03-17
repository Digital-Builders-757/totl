# Talent UX Polish — P0/P1 Punchlist (Production Review)

**Date:** 2026-03-17

**Purpose:** Capture a copy/paste-ready punchlist of the highest-leverage Talent UX fixes from a production Browser Relay walkthrough (Talent logged in).

## Scope
- Role: **Talent**
- Surfaces reviewed:
  - `/talent/dashboard`
  - `/gigs` (Find Opportunities)
  - `/gigs/[id]` (Gig detail)
  - `/gigs/[id]/apply` (Apply flow)

**RED ZONE INVOLVED:** NO (UI-only; Terminal)

---

## P0 — Must-do (v1 clarity + conversion)

### P0.1 Single primary CTA on dashboard
**Problem:** Dashboard reads like analytics first; primary job-to-be-done is “find gigs and apply.”

**Fix:** Add one strong primary button near the top of the dashboard:
- **Browse opportunities** → `/gigs`

**Acceptance:** On mobile, the user sees a clear primary CTA without needing to interpret KPI cards.

---

### P0.2 Reduce “Next action” repetition in KPI cards
**Problem:** KPI cards each include “Next action,” creating multiple competing instructions.

**Fix options:**
- **Option A (recommended):** remove “Next action” lines from all KPI cards.
- **Option B:** keep “Next action” only on **Total Applications**.

**Acceptance:** Dashboard reads as “status + one next step,” not “six instructions.”

---

### P0.3 Shrink `/gigs` hero height to reclaim above-the-fold
**Problem:** “Find Opportunities” hero + subcopy consumes too much vertical space; users don’t see gigs quickly.

**Fix:** Reduce vertical padding/margins in the hero section so filters and at least the first gig card appear sooner (mobile-first).

**Acceptance:** On mobile, filters + first listing are visible with minimal scroll.

---

## P1 — Professional polish (reduce overwhelm)

### P1.1 Collapse advanced filters by default
**Problem:** Too many fields visible at once increases cognitive load.

**Fix:** Default visible fields:
- Keyword
- Type
- Location
- Search

Move the following behind a “More filters” accordion:
- Radius
- Compensation keyword
- Pay range
- Sort
- Upcoming toggle

**Acceptance:** New users can search quickly; power users can expand advanced filters.

---

### P1.2 Saved searches: avoid “disabled controls” look
**Problem:** When there are 0 saved searches, “Load saved search” and “Manage” being disabled reads as broken.

**Fix:**
- When saved searches = 0:
  - Hide “Load saved search” dropdown
  - Hide “Manage”
  - Show only **Save this search** + helper text (e.g., “Save your filters for 1-click reuse.”)
- When saved searches >= 1:
  - Show Load + Manage

**Acceptance:** No disabled UI controls are visible in the “empty” state.

---

### P1.3 Apply page: tighten reassurance copy
**Problem:** Some users hesitate on submit; make it explicit what’s included.

**Fix:** Add a crisp one-liner above the cover letter field:
- “Your profile + portfolio are included automatically.”

**Acceptance:** Apply page feels confident and reduces uncertainty.

---

## P2 — Nice-to-have (mobile density)

### P2.1 Mobile breadcrumbs: simplify
**Problem:** Breadcrumbs take vertical space on small screens.

**Fix:** On small screens, collapse to a single “← Back” row.

**Acceptance:** More content above the fold; navigation remains clear.

---

## Notes / Observations
- Apply funnel completes cleanly in production; KPI “Total Applications” increments after submit.
- Recent fixes (Profile Strength moved to Settings; gig card alignment/glow) materially improve perceived quality.
