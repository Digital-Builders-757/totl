# TOTL Catch-up Roadmap

**Last updated:** May 5, 2026

This is the current execution order for the next TOTL improvement batches.
Use it with `PROJECT_STATUS_REPORT.md` for live priorities and the specific `docs/work-orders/*.md` files for Cursor prompts.

---

## Product goal

TOTL should feel like a polished talent booking platform end-to-end, not just a functional marketplace.

What to borrow from the better work in the other repos:
- **ViZb** for lighter, more intentional app shells, loading polish, and cleaner editorials
- **MMVA** for session-aware auth flows, settings/account structure, and clearer dashboard entry
- **Both** for better loading states, clearer hierarchy, and route intent that feels like a real product

What to keep from TOTL:
- premium agency tone
- talent/client workflow clarity
- strong booking and opportunity infrastructure
- production-safe Supabase-first architecture

---

## Product principles

1. **One clean entry path**
   - auth should feel like entering the product, not bouncing between marketing and app shells

2. **One readable interior**
   - app surfaces should feel lighter, clearer, and more intentional

3. **Ship one slice fully**
   - each batch should end with docs updated, verified, and ready to hand off

4. **Prefer existing primitives**
   - reuse `TotlBrandLoading*`, `TotlEditorialSection`, `PageShell`, `PageHeader`, `AdminHeader`, `ClientTerminalHeader`, `MobileSummaryRow`, and `DataTableShell` where they fit

---

## Roadmap

### 1. Public entry funnel + loading-state cohesion

**Why this first:** the first impression still needs to feel more coherent and app-like.

**Deliverables:**
- cleaner public/home → auth → role flow
- better loading shell consistency
- fewer jarring transitions between marketing and app interior
- reuse the branded loading primitives already in the codebase

**Definition of done:**
- the first click path feels deliberate
- loaders appear instantly and consistently
- public entry no longer feels like a rough edge

**Current work order:** `docs/work-orders/TOTL_PUBLIC_ENTRY_AND_LOADING_COHESION_WORK_ORDER.md`

---

### 2. Auth session handoff + role redirects

**Why this is next:** auth should preserve intent and land people in the right place every time.

**Deliverables:**
- callback/session handoff cleanup
- role-aware redirect behavior
- less ambiguity around sign-in, reset, and onboarding entry
- clear fallback states when profile/role data is missing

**Definition of done:**
- signed-in users land where they expected
- auth no longer feels flaky or circular
- role routing is easy to reason about

**Current work order:** `docs/work-orders/TOTL_AUTH_SESSION_HANDOFF_WORK_ORDER.md`

---

### 3. Dashboard density + settings/account rebuild

**Why this is next:** client/talent/admin interiors should feel like real app surfaces, not placeholder panels.

**Deliverables:**
- better hierarchy and spacing in dashboards
- proper settings/account destinations
- clearer admin/client/talent headers
- more readable cards, tables, and summaries

**Definition of done:**
- the app interior feels calm and legible
- account management feels like a normal settings experience
- dense surfaces are easier to scan on mobile and desktop

**Current work order:** `docs/work-orders/TOTL_DASHBOARD_DENSITY_AND_SETTINGS_WORK_ORDER.md`

---

### 4. Patreon + notifications + booking resilience

**Why this is next:** the recurring pain points should be explainable and recoverable.

**Deliverables:**
- Patreon connection and entitlement sync clarity
- notifications button / panel reliability
- booking reminder and notification surfaces that behave
- safer failure copy and operator visibility

**Definition of done:**
- Patreon issues are understandable and recoverable
- notification UI works reliably
- booking/reminder flows do not feel fragile

**Current work order:** `docs/work-orders/TOTL_PATREON_AND_NOTIFICATION_RESILIENCE_WORK_ORDER.md`

---

### 5. Discovery, opportunity, and comp-card polish

**Why this is next:** the marketplace should feel richer once the shell is stable.

**Deliverables:**
- sharper gig/opportunity discovery
- better filters and cards
- follow-through on collab / comp-card / provenance work
- smoother talent profile depth and presentation

**Definition of done:**
- opportunities are easier to scan and act on
- talent profiles feel more like digital comp cards
- the experience feels more complete

**Current work order:** `docs/work-orders/TOTL_DISCOVERY_AND_COMP_CARD_POLISH_WORK_ORDER.md`

---

### 6. Visual style alignment / shared primitives audit

**Why this is still useful:** small visual inconsistencies accumulate quickly across a product this size.

**Deliverables:**
- route-by-route visual cleanup
- consistent use of shared primitives
- mobile density cleanup where needed
- alignment between public, client, talent, and admin interiors

**Definition of done:**
- the product feels like one system
- shared primitives are actually doing the work
- the app feels premium without extra noise

**Current work order:** `docs/work-orders/TOTL_VISUAL_STYLE_ALIGNMENT_WORK_ORDER.md`

---

## Cursor execution rule

Work top to bottom.
Do not start the next batch until the current one is done, verified, and documented.

After each batch:
- update the relevant docs
- verify the implementation
- leave the repo in a shippable state
