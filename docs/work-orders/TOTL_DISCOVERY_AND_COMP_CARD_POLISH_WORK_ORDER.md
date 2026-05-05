# TOTL Discovery + Comp-Card Polish Work Order

Related roadmap: `docs/plans/TOTL_CATCHUP_ROADMAP.md`.
Execution companion: `PROJECT_STATUS_REPORT.md`.

## Goal
Make discovery and profile surfaces feel more complete and easier to use.

This batch builds on the opportunity / comp-card work already in motion and tightens the discovery experience around it.

## Product decision
Keep the existing opportunity model, then make the surfaces that feed it feel more premium and useful.

## What to build

### Discovery
- Improve opportunity browsing and filtering.
- Make cards easier to scan.
- Surface the most useful action paths more clearly.

### Comp-card / profile depth
- Continue the comp-card style profile evolution.
- Make the talent profile feel more like a real agency card.
- Keep the guidance and profile data structured cleanly.

### Collaboration and provenance
- If the collab/provenance work still needs polish, keep it server-validated and obvious in the UI.
- Preserve the current admin visibility where implemented.

## Implementation guidance
- Inspect gig/opportunity routes, talent profile surfaces, and the existing opportunity expansion work order.
- Reuse the current fields, cards, and status patterns.
- Do not invent a second discovery system.
- Keep the feature usable on mobile.

## Acceptance criteria
- Discovery is easier to scan.
- Profiles feel more like digital comp cards.
- Collab/provenance details stay clear.
- Build passes.

## Suggested implementation order
1. Inspect the current opportunity and profile surfaces.
2. Tighten discovery cards and filters.
3. Polish comp-card/profile presentation.
4. Verify the collaboration/provenance flow.
5. Update docs if any fields or route intent changes.

## Notes
- This should feel like a sharper creative marketplace, not just a database of jobs.
- Keep the premium tone.
