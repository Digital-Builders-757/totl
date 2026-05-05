# TOTL Dashboard Density + Settings Rebuild Work Order

Related roadmap: `docs/plans/TOTL_CATCHUP_ROADMAP.md`.
Execution companion: `PROJECT_STATUS_REPORT.md`.

## Goal
Make the authenticated interiors feel like real product surfaces, not placeholder dashboards.

This batch focuses on client, talent, and admin density, plus a proper settings/account destination.

## Product decision
Use the existing shared layout primitives and the better shell patterns from the other apps to raise readability and hierarchy.

## What to build

### Dashboard interiors
- Improve spacing, hierarchy, and scanability.
- Make dense surfaces easier to read on desktop and mobile.
- Use the right shared primitives for summaries, cards, and tables.

### Settings/account
- Put account/profile actions in a proper settings surface.
- Make sign-out and account management feel normal and obvious.
- Avoid hiding account behavior in the header alone.

### Admin/client/talent shells
- Keep the terminal headers and page shells consistent.
- Reuse `AdminHeader`, `ClientTerminalHeader`, `PageShell`, `PageHeader`, `MobileSummaryRow`, and `DataTableShell` where appropriate.

## Implementation guidance
- Inspect client dashboard, talent dashboard, admin sections, profile, and settings surfaces.
- Borrow the app-interior structure discipline from ViZb/MMVA.
- Do not change auth rules or business logic unless needed for the shell.
- Keep mobile readable.

## Acceptance criteria
- The dashboard feels calmer and more legible.
- Settings/account feels like a normal place to land.
- Shared primitives are used consistently.
- Build passes.

## Suggested implementation order
1. Inspect the dashboard and settings entry points.
2. Normalize the shell and density primitives.
3. Move account/profile actions into settings if needed.
4. Verify mobile and desktop readability.
5. Update docs if route intent changes.

## Notes
- This is the batch that makes the app interior feel intentional.
- Use the more readable shell language from the other repos, but keep TOTL premium.
