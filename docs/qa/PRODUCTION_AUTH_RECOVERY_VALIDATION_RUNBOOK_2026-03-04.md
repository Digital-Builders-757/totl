# Production Auth Recovery Validation Runbook (Step-3)

**Date:** March 4, 2026  
**Status:** 📋 READY FOR EXECUTION  
**Purpose:** Execute and record production validation for reset-link recovery and suspended-user routing without changing middleware/auth architecture.

---

## Scope

- Signed-out reset-link recovery flow validation.
- Signed-in reset-link recovery flow validation.
- Suspended-user routing enforcement validation.

This runbook is manual/ops-oriented and complements:
- `tests/auth/auth-regressions.spec.ts` (local automation guardrails)
- `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` (routing/auth invariants)

---

## Preconditions

- Local baseline stays green before production checks:
  - `npm run test:qa:step3-baseline:preflight`
- You have access to:
  - production app URL
  - test mailbox for reset-link flow
  - an intentionally suspended production-safe test account
- No auth middleware changes are deployed during this validation window.

---

## Validation matrix

### A) Signed-out recovery link flow

1. Sign out fully and clear browser session.
2. Trigger password reset from `/reset-password`.
3. Open received recovery link in fresh signed-out context.
4. Verify:
   - lands on `/update-password` (no bounce to `/login`)
   - password update form/gate renders
   - successful password update leads to expected post-reset behavior
5. Record result + artifacts.

### B) Signed-in recovery link flow

1. Sign in as non-suspended user.
2. Trigger password reset for that signed-in account.
3. Open recovery link while still signed in.
4. Verify:
   - remains on `/update-password` during recovery intent
   - no unexpected redirect loop to `/login`
   - successful password update completes normally
5. Record result + artifacts.

### C) Suspended-user enforcement

1. Sign in as suspended test account.
2. Attempt direct navigation to:
   - `/update-password`
   - `/reset-password`
3. Verify:
   - both paths force redirect to `/suspended`
   - hard refresh while on suspended state remains on `/suspended`
4. Record result + artifacts.

---

## Evidence requirements

- Minimum artifacts per scenario:
  - one screenshot of final route state
  - one short recording for critical redirect behavior
- Suggested naming pattern:
  - `prod__auth-recovery__signed-out__update-password__result.png`
  - `prod__auth-recovery__signed-in__update-password__result.png`
  - `prod__auth-recovery__suspended__reset-password__redirect.webm`
- Store under:
  - `screenshots/ui-audit-2026-03-03-v2/` (or current QA evidence folder in use)

---

## Exit criteria

- Signed-out recovery link: PASS.
- Signed-in recovery link: PASS.
- Suspended-user enforcement (`/update-password`, `/reset-password`, refresh): PASS.
- Any drift logged in:
  - `docs/qa/PLAYWRIGHT_TRIAGE_LOG_2026-03-04.md`
  - `MVP_STATUS_NOTION.md` (NOW board updates)

