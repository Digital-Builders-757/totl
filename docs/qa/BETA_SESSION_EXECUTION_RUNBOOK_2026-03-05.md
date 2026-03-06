# Beta Session Execution Runbook (Live Testers)

Date: 2026-03-05  
Owner: Product + QA + Engineering

## Goal
Run live beta sessions consistently, capture issues with reproducible evidence, and feed findings into launch triage quickly.

## Required Inputs
- Smoke checklist: `docs/qa/BETA_SMOKE_TEST_CHECKLIST_2026-03-05.md`
- Feedback log: `PAST_PROGRESS_HISTORY.md` (Beta Feedback Log section)
- Test accounts:
  - admin
  - talent
  - client (or approved client-equivalent access)

## Session Setup (5 minutes)
1. Confirm target environment (preview/prod/local) and browser/device.
2. Start with a clean browser profile/incognito session.
3. Confirm tester has account credentials for the assigned role.
4. Assign one note-taker who logs findings directly into `PAST_PROGRESS_HISTORY.md`.

## Session Flow
1. Execute checklist section 1 (Subscription Flow).
2. Execute checklist section 2 (Applications Flow).
3. Execute checklist section 3 (Moderation/Admin Flow).
4. For every bug or ambiguity:
   - capture route
   - capture exact repro steps
   - capture expected vs actual behavior
   - attach screenshot/video evidence

## Severity Rubric
- `P0` - launch blocker, core flow broken, no workaround
- `P1` - major degradation, workaround exists but risky
- `P2` - moderate UX/logic issue, non-blocking for launch
- `P3` - polish/documentation issue

## Evidence Requirements
Each reported issue must include:
- environment + browser/device
- full route path
- timestamp
- screenshot/video
- whether reproducible (always/intermittent)

## Logging Format
Use the template already in `PAST_PROGRESS_HISTORY.md` under:
- `# 🧪 BETA FEEDBACK LOG (MARCH 2026)`

## Exit Criteria Per Session
- All checklist items marked PASS / PASS WITH NOTES / FAIL
- All failures logged with severity + owner
- Follow-up ETA recorded for each non-pass item

## Daily Triage Cadence
- Consolidate all session entries at end of day
- Create fix queue ordered by severity (`P0` -> `P3`)
- Re-run impacted smoke routes after each fix batch
