# Archive Docs Index

**Date:** March 9, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Provide an entry point for historical and superseded documentation while steering day-to-day work back to canonical docs.

## Use Archive Last

Archive docs are historical reference only.

Use current canonical docs first:
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/contracts/INDEX.md`
- `docs/journeys/INDEX.md`
- `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`

If an archived document conflicts with a current contract, journey, constitution, or index entry, treat the archived doc as superseded.

## High-Value Historical Pointers

### Auth History

- `AUTH_LEGACY_INDEX.md` - starting point for legacy auth investigations
- `AUTH_REDIRECT_FIX_NOV_2025.md` - historical redirect fix notes
- `AUTH_PROVIDER_BREAKDOWN_AND_FIXES.md`
- `AUTH_PROVIDER_IMPLEMENTATION_SUMMARY.md`
- `AUTH_PROVIDER_TEST_RESULTS.md`

### Build / Tooling History

- `BUILD_AND_AUDIT_REFERENCE.md`
- `BUILD_PRERENDER_FIX_REFERENCE.md`
- `INSTRUMENTATION_AND_SCRIPTS_REFERENCE.md`
- `DEBUG_MISSING_API_KEY_PLAN_JAN_2025.md`

### Product / Analysis History

- `SDA_DELIVERABLES_REPORT.md`
- `SDA_EXECUTIVE_SUMMARY.md`
- `TERMINOLOGY_UPDATE_PLAN.md`
- `CAREER_BUILDER_LOGIN_SIGNUP_ANALYSIS.md`
- `CAREER_BUILDER_SIGNUP_FIX_PLAN.md`

### Docs Overhaul (March 2026)

- `ORGANIZATION_SUMMARY.md` — Superseded by `DOCUMENTATION_INDEX.md`
- `GOLD_STANDARD_IMPLEMENTATION_COMPLETE.md` — One-off completion report
- `BETA_TESTING_CHECKLIST.md` — Superseded by `qa/BETA_SMOKE_TEST_CHECKLIST_2026-03-05.md`
- `COMPREHENSIVE_QA_CHECKLIST.md` — Use `development/PRE_PUSH_CHECKLIST.md` + `qa/README.md` (stub at `docs/COMPREHENSIVE_QA_CHECKLIST.md`)
- `UI_UX_TESTING_GUIDE.md` — Use `audits/UI_UX_SCREENSHOT_REMEDIATION_REPORT_2026-03-03.md` + `qa/README.md` (stub at `docs/UI_UX_TESTING_GUIDE.md`)

## When To Add Something Here

Move a doc into `docs/archive/` when:
- it is historical or superseded
- the current source of truth already exists elsewhere
- keeping it in an active folder would create ambiguity

Do not archive canonical docs such as:
- constitutions
- contracts
- journeys
- active runbooks still referenced by the execution board
