# Mobile UX QA Checklist (Launch)

> Repo: `C:\Users\young\Desktop\Project Files\totl`
>
> Purpose: **route-by-route** mobile QA checklist that enforces our mobile UI/UX contract across the entire app as we prep for launch.
>
> Reference docs:
> - `docs/development/DASHBOARD_MOBILE_DENSITY_GUIDE.md`
> - `docs/development/MOBILE_UX_AUDIT_SCREEN_INVENTORY.md`

---

## Mobile QA contract (apply to every dashboard/list screen)
Use this as the pass/fail rubric.

### A) Above-the-fold budget (mobile)
- Viewports: **360×800** and **390×844**.
- First viewport must show:
  - compact header
  - primary segmentation (if applicable)
  - first meaningful content row/card **or** empty state

### B) One segmentation control rule
On mobile, choose **exactly one**:
- Tabs **OR** status dropdown
- Anything secondary goes into **FiltersSheet**.

### C) Filters discipline
- Search stays visible.
- Secondary filters live in **FiltersSheet**.
- If filters are active:
  - show `Filters (n)` count
  - show a small chip summary row (optional but preferred)

### D) Stats discipline
- No stacked “fat stat cards” before content on `<md`.
- Use:
  - collapsed stats (`Show stats`) **or**
  - compact summary row (`MobileSummaryRow`).

### E) Lists/Tables
- No horizontal scrolling on mobile for core lists.
- Prefer `MobileListRowCard` pattern for `<md`.
- Tap targets ≥ **44px**.

### F) Drawer/Sheet behavior
- Backdrop blocks background interaction.
- Close works via:
  - close button
  - backdrop tap
  - route change
- Role-scoped nav links only (no cross-terminal leakage).

### G) Emoji/icon policy
- No emojis in persistent chrome (nav labels, card titles, stat labels).
- Icons: **Lucide only**, consistent size.

---

## Must-test routes (by terminal)
> Source: `app/**/page.tsx` route inventory.

### 1) Client terminal (`/client/*`) — Wave 1
- `/client/dashboard`
  - Verify: compact client terminal header + drawer
  - Verify: stats collapsed by default; no top-heavy stat stack
- `/client/applications`
  - Verify: tabs are primary segmentation; no duplicate status dropdown
  - Verify: FiltersSheet contains secondary filters; `Filters (n)` works
  - Verify: list rows are mobile-friendly; no horizontal scroll
- `/client/gigs`
  - Verify: no duplicated segmentation; stats compact/collapsible
- `/client/bookings` *(if used in launch flow)*
- `/client/profile`
- `/client/apply`
- `/client/apply/success`
- `/client/application-status`
- `/client/signup`

### 2) Talent terminal (`/talent/*`) — Wave 2
- `/talent/dashboard`
  - Verify: stats compact/collapsible (match contract)
- `/talent/profile`
- `/talent/settings/billing`
- `/talent/signup`
- `/talent/subscribe`
- `/talent/subscribe/success`
- `/talent/subscribe/cancelled`
- `/talent/[slug]` (public profile)

### 3) Admin terminal (`/admin/*`) — Wave 3
- `/admin/dashboard`
- `/admin/applications`
- `/admin/applications/[id]`
- `/admin/users`
- `/admin/users/create`
- `/admin/gigs`
- `/admin/gigs/create`
- `/admin/client-applications`
- `/admin/talent`
- `/admin/moderation`

---

## Cross-flow routes (high drop-off)
These must feel clean on mobile even if they aren’t “dashboards.”

### Auth & lifecycle
- `/login`
- `/auth/callback`
- `/choose-role`
- `/onboarding`
- `/onboarding/select-account-type`
- `/reset-password`
- `/update-password`
- `/verification-pending`
- `/suspended`

### Marketplace / gigs
- `/gigs`
- `/gigs/[id]`
- `/gigs/[id]/apply`
- `/post-gig`

### User settings
- `/settings`
- `/profile`

---

## Evidence checklist (per PR)
For any PR that touches dashboard/list chrome:
- [ ] List impacted routes + terminals (client/talent/admin)
- [ ] Screenshots (or recordings) at **360×800** + **390×844** for impacted routes
- [ ] Confirm: no new reads in chrome primitives (header/drawer/filter triggers)
- [ ] Confirm: no horizontal scroll introduced
- [ ] Confirm: drawer/sheet closes on route change
- [ ] Confirm: no red-zone files touched (middleware/auth callback/RLS/webhooks)

---

## Wave tracker (mark PASS/FAIL as you QA)

> Use: `PASS` / `FAIL` / `N/A` / `TODO` + a short note. Add date initials if helpful.

### Wave 1 — Client terminal (`/client/*`)
- [x] `/client/dashboard` — PASS — Code sweep complete (mobile tab rail + CTA hierarchy); manual drawer behavior check pending
- [x] `/client/applications` — PASS — Code sweep complete (deduplicated mobile filtering + tab rail density)
- [x] `/client/gigs` — PASS — Code sweep complete (tab rail density + compact top spacing)
- [x] `/client/bookings` — PASS — Code sweep complete (terminal header + collapsed mobile stats + tab rail + compact spacing)
- [x] `/client/profile` — PASS — Route contract green (`tests/client/client-profile-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/client__profile__{360x800,390x844,1440x900}__loaded.png`

### Wave 2 — Talent terminal (`/talent/*`)
- [x] `/talent/dashboard` — PASS — Code sweep complete (mobile tab rail density + compact top spacing)
- [x] `/talent/profile` — PASS — Route contract green (`tests/talent/talent-profile-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/talent__profile__{360x800,390x844,1440x900}__loaded.png`
- [x] `/talent/settings/billing` — PASS — Route contract green (`tests/talent/talent-billing-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/talent__settings-billing__{360x800,390x844,1440x900}__loaded.png`
- [x] `/talent/subscribe` — PASS — Route contract green (`tests/talent/talent-subscribe-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/talent__subscribe__{360x800,390x844,1440x900}__loaded.png`

### Wave 3 — Admin terminal (`/admin/*`)
- [x] `/admin/dashboard` — PASS — Code sweep complete (collapsed mobile stats + tab rail density)
- [x] `/admin/applications` — PASS — Route contract green (`tests/admin/admin-applications-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/admin__applications__{360x800,390x844,1440x900}__loaded.png`
- [x] `/admin/users` — PASS — Route contract green (`tests/admin/admin-users-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/admin__users__{360x800,390x844,1440x900}__loaded.png`
- [x] `/admin/gigs` — PASS — Route contract green (`tests/admin/admin-gigs-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/admin__gigs__{360x800,390x844,1440x900}__loaded.png`
- [x] `/admin/talent` — PASS — Route contract green (`tests/admin/admin-talent-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/admin__talent__{360x800,390x844,1440x900}__loaded.png`
- [x] `/admin/moderation` — PASS — Route contract green (`tests/admin/admin-moderation-route.spec.ts`) + screenshots in `screenshots/ui-audit-2026-03-03-v2/admin__moderation__{360x800,390x844}__loaded.png`

---

## Notes
- This checklist intentionally does not enumerate every marketing page—focus is launch-critical flows and terminals.
- If a route introduces a local header/drawer, it must be applied consistently across that terminal or documented as a temporary exception.
- Manual client drawer smoke runbook (physical-device pending item): `docs/qa/CLIENT_DRAWER_MANUAL_VALIDATION_RUNBOOK_2026-03-04.md`.
