# UI Contract Drift Ledger

**Date:** March 3, 2026  
**Status:** Active drift backlog (docs != code mismatches)  
**Canonical law:** `docs/UI_CONSTITUTION.md`  
**Implementation map:** `docs/UI_IMPLEMENTATION_INDEX.md`

---

## Purpose

Track every UI contract mismatch as a closure-ready item with owner, evidence, and PR linkage.

This ledger is the execution backlog for “one law” UI governance.

---

## Drift table

Impact legend:
- `P0` = must fix for launch-quality mobile contract
- `P1` = next wave after P0
- `P2` = opportunistic/post-launch

Status legend:
- `TODO` -> `IN_PROGRESS` -> `REVIEW` -> `DONE`

| Rule (UI Constitution) | Current reality (route/component) | Impact | Fix pattern (standard primitive) | Owner | PR link | Status | Evidence required |
|---|---|---|---|---|---|---|---|
| Above-the-fold budget on mobile | `/admin/dashboard` stacks KPI bands + tabs before first actionable module | P0 | `AdminHeader` + `MobileSummaryRow` + one segmentation control | codex-agent | TBD | DONE | evidence captured at `screenshots/ui-audit-2026-03-03-v2/admin__dashboard__{390x844,360x800,1440x900}__loaded.png`; dimensions verified |
| One segmentation control rule | `/admin/applications` mixes dense top controls before content | P0 | single segmentation + `FiltersSheet` for secondary filters | codex-agent | TBD | DONE | evidence captured at `screenshots/ui-audit-2026-03-03-v2/admin__applications__{390x844,360x800,1440x900}__loaded.png`; dimensions verified |
| Mobile list/table adaptation | `/admin/users` remains dense for compact viewports | P0 | card/list adaptation + `DataTableShell` where tabular view remains | codex-agent | TBD | DONE | evidence captured at `screenshots/ui-audit-2026-03-03-v2/admin__users__{390x844,360x800,1440x900}__loaded.png`; dimensions verified |
| KPI dominance before meaningful row | `/talent/dashboard` has stacked prompts/stats before first focused module | P0 | collapse KPI blocks with `MobileSummaryRow`; promote one task module | codex-agent | TBD | DONE | evidence captured at `screenshots/ui-audit-2026-03-03-v2/talent__dashboard__{390x844,360x800,1440x900}__loaded.png`; dimensions verified |
| Filters discipline and list readability | `/admin/gigs` and `/admin/client-applications` needed consistent filter-sheet/list pattern | P1 | `FiltersSheet` + mobile list/card structure | codex-agent | TBD | DONE | evidence refreshed at `screenshots/ui-audit-2026-03-03-v2/admin__gigs__{390x844,360x800,1440x900}__loaded.png` and `screenshots/ui-audit-2026-03-03-v2/admin__client-applications__{390x844,360x800,1440x900}__loaded.png`; manifest now `46/46 success`, dimensions verified |
| Dashboard density consistency | `/client/dashboard` still has top-heavy section stack at mobile widths | P1 | `ClientTerminalHeader` + compact summary + content-first ordering | codex-agent | TBD | DONE | top-chrome trimmed and first meaningful module promoted above fold; refreshed evidence at `screenshots/ui-audit-2026-03-03-v2/client__dashboard__{390x844,360x800,1440x900}__loaded.png`; viewport labels verified |
| Progressive form structure | `/client/profile` and `/talent/profile` are long uninterrupted form stacks | P1 | sectioned progressive form rhythm with stable action placement | codex-agent | TBD | DONE | added section rhythm/progressive disclosure + sticky action bar; refreshed evidence at `screenshots/ui-audit-2026-03-03-v2/client__profile__{390x844,360x800,1440x900}__loaded.png` and `screenshots/ui-audit-2026-03-03-v2/talent__profile__{390x844,360x800,1440x900}__loaded.png`; viewport labels verified |
| Billing progressive disclosure | `/talent/settings/billing` needed compact first viewport and stable mobile action placement | P1 | `PageShell` + section disclosure rhythm + sticky primary billing CTA | codex-agent | TBD | DONE | billing route aligned to shell/header baseline with disclosure + sticky action; evidence captured at `screenshots/ui-audit-2026-03-03-v2/talent__settings-billing__{390x844,360x800,1440x900}__loaded.png`; viewport labels verified |
| Admin talent list adaptation | `/admin/talent` needed mobile card adaptation and compact above-the-fold summary | P1 | `MobileSummaryRow` + `MobileListRowCard` + `DataTableShell` | codex-agent | TBD | DONE | evidence refreshed at `screenshots/ui-audit-2026-03-03-v2/admin__talent__{390x844,360x800,1440x900}__loaded.png`; manifest now `46/46 success`, dimensions verified |
| Screenshot evidence integrity | viewport-labeled files can mismatch actual dimensions if capture defaults | P0 | enforce viewport before capture + dimension verification script | codex-agent | TBD | DONE | capture now uses viewport-sized screenshots (no full-page); admin evidence dimensions verified `18/18` |
| Non-admin screenshot auth stability | local screenshot runner could not authenticate client/talent seeded accounts in current env | P0 | refresh seeded non-admin credentials or re-seed accounts before capture | codex-agent | TBD | DONE | added `scripts/ensure-ui-audit-users.mjs`; full rerun now green (`46/46 success`) |

---

## Weekly drift ritual (30 minutes)

1. Pick 3 routes from this ledger.
2. Compare current route screenshots vs constitution contract.
3. Update ledger rows:
   - status
   - owner
   - PR link
   - evidence notes
4. Add any new drift rows found.

Do not close a row without attached evidence artifacts.

