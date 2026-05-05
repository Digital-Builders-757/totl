# TOTL Public Entry + Loading-State Cohesion Work Order

Related roadmap: `docs/plans/TOTL_CATCHUP_ROADMAP.md`.
Execution companion: `PROJECT_STATUS_REPORT.md`.

## Goal
Make the first impression feel like a clean app entry, not a rough handoff between marketing and product.

This batch focuses on the public entry path, the first authenticated transition, and the loading experience.

## Product decision
Use the best shell and loading ideas already present in the codebase, including the branded loading patterns and editorial canopy treatments, and tighten the entry path so it feels deliberate.

## What to build

### Public entry
- Clean up the public/home entry path so it clearly points into the product.
- Make the first click path feel intentional.
- Reduce friction between marketing entry and app interior.

### Loading cohesion
- Use consistent branded loading states across the touched routes.
- Prefer the existing `TotlBrandLoading*` and related shell primitives where possible.
- Avoid generic blank or jumpy waits.

### Entry handoff
- Make sure the first signed-in transition feels like entering the app.
- Keep the route intent obvious.
- Avoid bouncey or ambiguous redirects.

## Implementation guidance
- Inspect the current home, login, choose-role, onboarding, and top-level loading routes.
- Reuse the existing loading and section primitives instead of inventing new ones.
- Keep the diff minimal.
- Do not change booking, gig, or dashboard business logic in this batch.

## Acceptance criteria
- The first click path feels clean.
- Loading states are consistent and branded.
- Users do not feel bounced between marketing and product.
- Build passes.

## Suggested implementation order
1. Inspect current public entry and loading routes.
2. Standardize the loading experience on the touched routes.
3. Tighten the public entry copy and handoff.
4. Verify the route transitions.
5. Update docs if any route intent changes.

## Notes
- This is about feel and continuity as much as functionality.
- Borrow the polished shell language from the other repos, but keep TOTL’s premium agency tone.
