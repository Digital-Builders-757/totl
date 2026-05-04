# TOTL Agency - UI Implementation Index (Doc <-> Code Lock)

**Date:** May 3, 2026  
**Status:** Canonical implementation index for UI governance  
**Primary law:** `docs/UI_CONSTITUTION.md`  
**Purpose:** Prevent contract drift by mapping each UI law to the exact owning primitive(s) in code.

---

## 1) Why this file exists

`UI_CONSTITUTION.md` defines the rules.  
This index defines where each rule is implemented and how to verify route compliance.

If a route violates the constitution and does not use the owning primitive, it is considered implementation drift.

---

## 2) Governance doc consolidation map

### Canonical (authoritative)
- `docs/UI_CONSTITUTION.md` (UI laws)
- `docs/UI_IMPLEMENTATION_INDEX.md` (rule -> primitive ownership)
- `docs/features/UI_LAYOUT_CONTRACT.md` (layout wrapper contract)
- `docs/development/MOBILE_UX_QA_CHECKLIST.md` (route QA gate)

### Active appendices (implementation/evidence)
- `docs/development/DASHBOARD_MOBILE_DENSITY_GUIDE.md`
- `docs/development/MOBILE_UX_AUDIT_SCREEN_INVENTORY.md`
- `docs/audits/UI_UX_SCREENSHOT_REMEDIATION_REPORT_2026-03-03.md`

### Merge/deprecate intent (do not delete yet)
- Keep detailed route findings in the screenshot report, but do not duplicate laws there.
- Keep density examples in the dashboard guide, but keep rules in constitution + this index.
- New UI governance docs should link back to the constitution instead of redefining laws.

---

## 3) Rule ownership map (current state)

| Law area | Owning primitive(s) | Notes |
|---|---|---|
| Admin terminal header/nav chrome | `components/admin/admin-header.tsx` (`AdminHeader`) | Canonical admin header owner |
| Client terminal header/nav chrome | `components/client/client-terminal-header.tsx` (`ClientTerminalHeader`) | Canonical client header owner |
| Talent terminal header/nav chrome | Route-local + shared shell (no single dedicated talent header primitive yet) | Marked in-progress; avoid introducing parallel talent header components |
| Secondary filters in a sheet | `components/dashboard/filters-sheet.tsx` (`FiltersSheet`) | Canonical mobile secondary filter container |
| Mobile KPI density control | `components/dashboard/mobile-summary-row.tsx` (`MobileSummaryRow`) | Use for compact summary instead of fat KPI stacks |
| Editorial / marketing hero canopy (section spotlight) | `components/ui/totl-editorial-section.tsx` (`TotlEditorialSection`) + `.totl-editorial-canopy` in **`app/globals.css`** | Lightweight wash for `/`, `/gigs` hero bands; avoids extra JS |
| Canonical page shell and heading | `components/layout/page-shell.tsx` (`PageShell`), `components/layout/page-header.tsx` (`PageHeader`) | Required baseline for new/touched full pages |
| Data table overflow handling | `components/layout/data-table-shell.tsx` (`DataTableShell`) | Required for table-like layouts on mobile |

---

## 3.1 Canonical decisions (one standard per primitive)

These decisions are binding for route work unless constitution/index are updated in the same PR.

1. **Terminal headers**
   - Admin: `AdminHeader` (`components/admin/admin-header.tsx`)
   - Client: `ClientTerminalHeader` (`components/client/client-terminal-header.tsx`)
   - Talent: canonical route-level header baseline is `PageHeader` until a dedicated `TalentTerminalHeader` primitive is introduced

2. **Mobile filter pattern**
   - `FiltersSheet` is the canonical secondary filter surface on mobile

3. **Mobile density pattern**
   - `MobileSummaryRow` for compact KPI summaries
   - `MobileListRowCard` for list/table rows that need mobile adaptation

4. **Admin table mobile adaptation**
   - `DataTableShell` for wrapped tabular rendering
   - move actionable dense tables toward card/list adaptation on `<md` where readability is poor

---

## 3.2 Usage map (where standards are already active)

### FiltersSheet
- `app/client/applications/client-applications-client.tsx`
- `app/admin/gigs/admin-gigs-client.tsx`
- `app/admin/client-applications/admin-client-applications-client.tsx`
- `app/admin/talent/admin-talent-client.tsx`

### MobileSummaryRow
- `app/admin/dashboard/admin-dashboard-client.tsx`
- `app/admin/client-applications/admin-client-applications-client.tsx`
- `app/admin/gigs/admin-gigs-client.tsx`
- `app/admin/talent/admin-talent-client.tsx`
- `app/client/dashboard/client.tsx`
- `app/client/gigs/client.tsx`
- `app/client/applications/client-applications-client.tsx`
- `app/client/bookings/page.tsx`
- `app/talent/dashboard/client.tsx`

### MobileListRowCard
- `app/client/applications/client-applications-client.tsx`
- `app/admin/client-applications/admin-client-applications-client.tsx`
- `app/admin/gigs/admin-gigs-client.tsx`
- `app/admin/talent/admin-talent-client.tsx`

### Canonical wrappers in active admin surfaces
- `DataTableShell` is used in:
  - `app/admin/applications/admin-applications-client.tsx`
  - `app/admin/client-applications/admin-client-applications-client.tsx`
  - `app/admin/gigs/admin-gigs-client.tsx`
  - `app/admin/moderation/admin-moderation-client.tsx`
  - `app/admin/talent/admin-talent-client.tsx`
  - `app/admin/users/admin-users-client.tsx`

---

## 4) Route compliance tracker (P0/P1)

Status legend:
- `COMPLIANT` - route uses owning primitives and satisfies mobile contract
- `IN_PROGRESS` - route partially aligned; remediation wave planned
- `DRIFT` - route currently violates one or more rules

| Route | Terminal | Wave | Expected primitives | Current status |
|---|---|---|---|---|
| `/admin/dashboard` | admin | P0-A | `AdminHeader`, `MobileSummaryRow`, single segmentation pattern | COMPLIANT |
| `/admin/applications` | admin | P0-A | `AdminHeader`, `FiltersSheet`, mobile list adaptation, `DataTableShell` where needed | COMPLIANT |
| `/admin/users` | admin | P0-A | `AdminHeader`, mobile list adaptation, `DataTableShell` where needed | COMPLIANT |
| `/talent/dashboard` | talent | P0-B | `MobileSummaryRow`, compact first viewport hierarchy | COMPLIANT |
| `/admin/gigs` | admin | P1-A | `AdminHeader`, `FiltersSheet`, mobile list adaptation | COMPLIANT |
| `/admin/client-applications` | admin | P1-A | `AdminHeader`, `FiltersSheet`, `MobileSummaryRow` | COMPLIANT |
| `/admin/talent` | admin | P1-A | `AdminHeader`, list/card mobile adaptation | COMPLIANT |
| `/client/dashboard` | client | P1-A | `ClientTerminalHeader`, `MobileSummaryRow` | COMPLIANT |
| `/client/profile` | client | P1-A | `PageShell` + progressive section rhythm | COMPLIANT |
| `/talent/profile` | talent | P1-A | `PageShell` + progressive section rhythm | COMPLIANT |
| `/talent/settings/billing` | talent | P1-A | `PageShell` + progressive section rhythm | COMPLIANT |

---

## 5) PR gate (Doc <-> Code lock)

Every PR touching terminal UI must satisfy one path:

1. **Reuse existing primitive(s)** from this index, or
2. **Propose a new primitive**, and in the same PR:
   - update `UI_CONSTITUTION.md` if law changes,
   - update this index with owner mapping,
   - attach before/after screenshots (`390x844`, `360x800`) for touched routes.
   - include desktop sanity screenshot (`1440x900`) for touched routes.

Fail the PR if:
- a new header/filter/list pattern is introduced without index mapping
- mobile route shows duplicate segmentation controls
- mobile route introduces horizontal overflow
- touched route lacks evidence screenshots at required viewports

---

## 6) Operating workflow

1. Read `UI_CONSTITUTION.md` for laws.
2. Read this index for owning components.
3. Implement route changes with those primitives.
4. Capture evidence screenshots for touched routes.
5. Update route status in this index (`DRIFT` -> `IN_PROGRESS` -> `COMPLIANT`).

