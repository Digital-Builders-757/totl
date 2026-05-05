# TOTL Visual Style Alignment Work Order

Related roadmap: `docs/plans/TOTL_CATCHUP_ROADMAP.md`.
Execution companion: `PROJECT_STATUS_REPORT.md`.

## Goal
Make the app feel like one coherent system.

This batch is the visual consistency pass across public, client, talent, and admin surfaces.

## Product decision
Use the same shell/primitives discipline everywhere and eliminate drift between routes.

## What to build

### Shared primitives
- Audit repeated cards, shells, headers, and table layouts.
- Reuse the canonical primitives instead of ad hoc wrappers.
- Prefer the loading and editorial patterns already in the codebase.

### Route consistency
- Check public, client, talent, and admin interiors for style drift.
- Tighten spacing, contrast, and hover states where needed.
- Keep the look premium but restrained.

### Mobile density
- Make dense surfaces easier to scan on smaller screens.
- Reduce overstacked panels or awkwardly dark areas.

## Implementation guidance
- Inspect the UI primitives, layout wrappers, and route-specific pages.
- Prefer incremental cleanup over broad redesign.
- Borrow the strongest shell language from ViZb/MMVA where it improves readability.
- Do not introduce a new design system.

## Acceptance criteria
- The product feels like one system.
- Shared primitives are used consistently.
- Mobile readability improves.
- Build passes.

## Suggested implementation order
1. Inspect the highest-traffic surfaces.
2. Identify repeated visual drift.
3. Normalize the primitives and shell usage.
4. Verify mobile and desktop consistency.
5. Update docs if any canonical primitive changes.

## Notes
- This is the cleanup pass that keeps the product premium.
- Small consistency wins matter here.
