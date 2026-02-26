# Mobile UI/UX Audit — Screen Inventory (TOTL)

> Goal: one canonical checklist of screens to audit on mobile for launch polish.
>
> Repo: `C:\Users\young\OneDrive\Desktop\Project Files\totl`
> 
> Source of truth: App Router routes discovered via `app/**/page.tsx`.

---

## 0) System-level surfaces (audit first)
These affect *every* screen and usually drive the biggest wins.

### Layouts
- `app/layout.tsx` (global)
- `app/admin/layout.tsx`
- `app/client/layout.tsx`
- `app/talent/layout.tsx`
- `app/login/layout.tsx`
- `app/post-gig/layout.tsx`

### Shared shell components
- `components/admin/admin-header.tsx`
- `components/navbar.tsx`
- `components/layout/page-shell.tsx`
- `components/layout/page-header.tsx`
- `components/layout/data-table-shell.tsx`

---

## 1) Admin (must-audit)
Primary admin routes:
- `/admin/dashboard`
- `/admin/users`
- `/admin/users/create`
- `/admin/gigs`
- `/admin/gigs/create`
- `/admin/gigs/success`
- `/admin/applications`
- `/admin/applications/[id]`
- `/admin/client-applications`
- `/admin/talent`
- `/admin/moderation`
- `/admin/diagnostic`

Secondary / legacy admin-ish routes:
- `/admin/talentdashboard`
- `/admin/talentdashboard/profile`

---

## 2) Client / Career Builder dashboards (must-audit)
Core client routes:
- `/client/dashboard`
- `/client/profile`
- `/client/gigs`
- `/client/bookings`
- `/client/applications`
- `/client/application-status`
- `/client/apply`
- `/client/apply/success`
- `/client/signup`

---

## 3) Talent / user dashboards (must-audit)
Core talent routes:
- `/talent/dashboard`
- `/talent/profile`
- `/talent/settings/billing`
- `/talent/signup`
- `/talent/subscribe`
- `/talent/subscribe/success`
- `/talent/subscribe/cancelled`
- `/talent/[slug]` (public talent profile)
- `/talent` (talent section entry)

---

## 4) General app routes (audit because they connect the flows)
Core:
- `/dashboard`
- `/profile`
- `/settings`
- `/gigs`
- `/gigs/[id]`
- `/gigs/[id]/apply`
- `/post-gig`
- `/project-overview`
- `/choose-role`
- `/onboarding`
- `/onboarding/select-account-type`

Auth / account lifecycle (high drop-off risk on mobile):
- `/login`
- `/auth/callback`
- `/reset-password`
- `/update-password`
- `/verification-pending`
- `/suspended`

---

## 5) Marketing / legal (lower priority for dashboard polish)
- `/` (home)
- `/about`
- `/privacy`
- `/terms`

---

## 6) Dev / test pages (ignore for launch polish unless shared components leak)
- `/ui-showcase`
- `/ui-showcase/animated-paths`
- `/test-sentry`

---

## Recommended audit order (fastest path to “launch-ready”)
### Phase 1 — Admin system fixes
1) Admin header + safe-area + hamburger drawer + overflow actions
2) Admin tables → mobile cards (or condensed rows) + row-level overflow
3) Filters/search collapse into drawer/bottom sheet

### Phase 2 — Client + Talent dashboards
4) `/client/dashboard`, `/client/gigs`, `/client/bookings`
5) `/talent/dashboard`, `/talent/profile`, `/talent/settings/billing`

### Phase 3 — Conversion + onboarding
6) `/login`, `/choose-role`, `/onboarding/*`
7) `/gigs/[id]` + apply flow + `/post-gig`

---

## Status / Notes (what’s already been improved)
> Paste/track progress here as changes land.

### Admin — Header First (Approach A)
Already addressed (per recent work log):
- Mobile-first admin chrome implemented in `components/admin/admin-header.tsx`:
  - safe-area aware header padding (header-only)
  - 56px mobile row (`h-14`)
  - hamburger trigger + drawer-style nav
  - centered route title (truncate)
  - notifications icon + overflow actions
  - removed emoji nav icons → consistent Lucide icons
  - added stable test hooks:
    - `data-testid="admin-header"`
    - `data-testid="admin-drawer-trigger"`
    - `data-testid="admin-drawer-panel"`
    - `data-testid="admin-overflow-trigger"`

Density trims (spacing/hierarchy) applied to:
- `app/admin/dashboard/admin-dashboard-client.tsx`
- `app/admin/users/admin-users-client.tsx`
- `app/admin/gigs/admin-gigs-client.tsx`
- `app/admin/applications/admin-applications-client.tsx`
- `app/admin/client-applications/admin-client-applications-client.tsx`
- `app/admin/talent/admin-talent-client.tsx`
- `app/admin/moderation/admin-moderation-client.tsx`

Testing/docs updates:
- Updated: `tests/admin/admin-dashboard-overflow-sentinel.spec.ts`
- Added: `docs/development/DASHBOARD_MOBILE_DENSITY_GUIDE.md`
- Indexed in: `docs/DOCUMENTATION_INDEX.md`

Implementation note:
- No existing `Sheet` primitive; used existing `Dialog` to implement the left drawer with minimal blast radius.

---

## Audit template (use per screen)
For each route, capture:
- Viewports: 360×800 (Android baseline), 390×844 (iPhone), 430×932 (large iPhone)
- Above-the-fold: header height, nav pattern, primary CTA clarity
- Density: tables vs cards, chip/badge overload, redundant controls
- Safe-area: notch padding and sticky overlap
- Accessibility: icon buttons `aria-label`, tap targets ≥44px, focus-visible styles
- Performance: skeletons match layout; no obvious CLS
