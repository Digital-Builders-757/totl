/continue

Intent: Resume forward progress without re-explaining “keep going.” Continue the best current thread using the existing roadmap, working tree, and recent progress.

MODE: EXECUTION

────────────────────────────────────────────
STEP 0 — MANDATORY CONTEXT
────────────────────────────────────────────
Before doing any work, read:
- docs/ARCHITECTURE_CONSTITUTION.md
- docs/DOCUMENTATION_INDEX.md
- docs/diagrams/airport-model.md
- MVP_STATUS_NOTION.md

Also inspect:
- git status
- the currently dirty files
- the most recently completed local verification results if available

────────────────────────────────────────────
STEP 1 — CHOOSE THE NEXT THREAD
────────────────────────────────────────────
Choose the next action using this priority order:

1. Continue the same active workstream already in the dirty tree.
2. Prefer shared primitives / high-leverage improvements over one-off route tweaks.
3. Prefer roadmap-safe local work if CI / deploy / production validation is currently paused or blocked.
4. Avoid opening a new domain unless the current thread is genuinely complete or blocked.

If there are unrelated dirty files:
- do not touch them unless explicitly requested
- work around them

────────────────────────────────────────────
STEP 2 — IMPLEMENT THE SMALLEST USEFUL WIN
────────────────────────────────────────────
Implement one meaningful next increment only.

Default preference order:
- shared layout / mobile UX primitives
- code quality / warning cleanup
- docs information architecture cleanup
- route-level polish only if shared primitives are no longer the better move

Do not:
- expand scope into a fresh subsystem without saying why
- start commit/PR/release flows unless explicitly requested
- undo or rewrite unrelated local changes

────────────────────────────────────────────
STEP 2.5 — AUTO-HANDOFF TO /SHIP
────────────────────────────────────────────
If `/continue` reaches a state where the current intended dirty set is a coherent, develop-ready batch and the next honest action is to commit/push rather than do more local edits:

- do **not** keep looping with more tiny local-only follow-ups
- do **not** wait for the user to separately type `/ship`
- immediately transition into the repo’s `/ship` workflow in the same turn

Treat the batch as **ready to ship** when all of these are true:
- the dirty files belong to one intended workstream
- relevant local verification for the touched work has already passed, or the only remaining unknown is an external CI rerun / remote check
- there is no clearly higher-value local increment left than committing and pushing

Auto-handoff safety rules:
- if unrelated dirty files exist, only ship the intended files
- if the batch is blocked by failing local checks, missing git identity, or another pre-push requirement, report the block clearly instead of looping
- if there is still a real local implementation step left, stay in `/continue`

────────────────────────────────────────────
STEP 3 — VERIFY BEFORE STOPPING
────────────────────────────────────────────
Run the smallest relevant checks for the touched files.

Typical expectation:
- npm run lint

If structural/shared UI files changed, also run:
- npm run build

If verification is blocked by a known external issue, say so explicitly and continue only if the current task can still be safely validated locally.

────────────────────────────────────────────
OUTPUT FORMAT
────────────────────────────────────────────
Return:
- what thread you continued
- why it was the highest-leverage next step
- changed files
- checks run + results
- the next best continuation point

If `/continue` auto-handed off to `/ship`, return the `/ship` results instead of this format.
