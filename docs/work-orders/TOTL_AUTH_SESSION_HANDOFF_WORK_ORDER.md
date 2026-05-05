# TOTL Auth Session Handoff + Role Redirect Work Order

Related roadmap: `docs/plans/TOTL_CATCHUP_ROADMAP.md`.
Execution companion: `PROJECT_STATUS_REPORT.md`.

## Goal
Make auth behave like a reliable app entry point.

This batch is for callback handling, preserved intent, and role-aware redirects.

## Product decision
Protect the intended destination and make the fallback state obvious when profile or role data is missing.

## What to build

### Callback and session handoff
- Verify the callback path exchanges session state cleanly.
- Preserve the `next` destination when it is valid.
- Handle missing or stale auth states explicitly.

### Role-aware entry
- Viewer entry should land in the right viewer surface.
- Client and talent entry should land in the right shell.
- Admin entry should land in the right operator workspace.

### Fallback states
- If role/profile data is missing or ambiguous, show a clear setup/onboarding path.
- Do not silently bounce users back into the wrong surface.

## Implementation guidance
- Inspect auth routes, middleware, callback routes, and role resolution helpers.
- Reuse the existing auth architecture instead of building a second one.
- Do not change booking or opportunity logic in this batch.
- Keep the current security model intact.

## Acceptance criteria
- Auth preserves intent.
- Users land in the expected app surface.
- Missing profile / role states are clear, not mysterious.
- Build passes.

## Suggested implementation order
1. Inspect auth login/callback/redirect helpers.
2. Fix the destination logic.
3. Tighten the fallback copy and role handling.
4. Verify login and logout flows.
5. Update docs if route intent changes.

## Notes
- This is the batch where auth stops feeling like a detour.
- Keep the UX calm and explicit.
