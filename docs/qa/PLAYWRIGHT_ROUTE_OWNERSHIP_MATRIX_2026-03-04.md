# Playwright Route Ownership Matrix (Step-3)

**Date:** March 4, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Canonical route-level ownership map for Step-3 QA hardening, including stable rerun commands and remaining manual validation scope.

---

## Canonical rerun commands

- Aggregate baseline:
  - `npm run test:qa:step3-baseline`
- Aggregate baseline with seed preflight:
  - `npm run test:qa:step3-baseline:preflight`
- Consolidated automatable critical path:
  - `npm run test:qa:critical-auto`
- Mobile contract rerun lane (route-owner guardrails only):
  - `npm run test:qa:mobile-guardrails`
- CI mobile contract rerun lane (resilient retries):
  - `npm run test:qa:mobile-guardrails:ci`
- Webhook integration failure-path contract:
  - `npm run test:qa:stripe-webhook-route`
- Domain reruns:
  - `npm run test:qa:admin-routes`
  - `npm run test:qa:client-routes`
  - `npm run test:qa:talent-routes`
  - `npm run test:qa:auth-regressions`
  - `npm run test:qa:invite-auth`
  - `npm run test:qa:client-drawer`

## Execution guardrails

- Run QA scripts sequentially on local env.
- Do not start domain suite scripts in parallel (`admin-routes`, `client-routes`, `talent-routes`), because each run starts a local web server and parallel starts can collide on `:3000`.
- If local startup collision occurs (`EADDRINUSE`), rerun the failed command sequentially.
- Route-user preflight note:
  - `client-routes`, `talent-routes`, `focused-routes`, and `mobile-guardrails` now run `node scripts/ensure-ui-audit-users.mjs` first so seeded client/talent personas are repaired before auth-protected route assertions execute.
  - If a local route contract run fails with `Login failed: Invalid credentials`, rerun the preflight explicitly and treat the failure as test-fixture/auth-baseline drift before assuming route UI regression.
- CI partitioning note:
  - `mobile-guardrails` now runs as a dedicated CI job to isolate mobile contract failures from build/lint/webhook safety checks.
- CI summary note:
  - `mobile-guardrails` job writes pass/fail totals to `GITHUB_STEP_SUMMARY` for fast PR triage.
  - `build` job now writes a one-glance per-gate outcome summary (lint/build/table-count/webhook/static guards) to `GITHUB_STEP_SUMMARY`.
  - both summaries include governance-doc pointers and run metadata (`workflow @ sha`) for traceable reruns.
  - both summaries include copy/paste local parity rerun commands.
  - both summaries include first-response triage checklist lines to standardize failed-run recovery.
- CI artifact note:
  - `mobile-guardrails` job always uploads `mobile-guardrails.log` and uploads `test-results/**` + `playwright-report/**` on failure for one-click triage evidence.
  - `build` job uploads `build-failure-artifacts` on failure (gate logs + build safety summary + Playwright failure outputs) for symmetric critical-path triage.
  - always-on summary artifacts include both human-readable (`.txt`) and machine-readable (`.json`) snapshots.
  - machine-readable snapshots include run-correlation metadata (`repository`, `refName`, `runId`, `runAttempt`) for deterministic reconciliation.
  - machine-readable snapshots are parse-validated in CI and include `schemaVersion` + `generatedAtUtc` for compatibility and ordering.
  - Artifact index (name/scope/retention):
    - `build-safety-summary` (7 days)
    - `mobile-guardrails-summary` (7 days)
    - `mobile-guardrails-log` (7 days)
    - `mobile-guardrails-failure-artifacts` (14 days)
    - `build-failure-artifacts` (14 days)

---

## Route ownership (automation)

| Route / Surface | Owning spec(s) | Script bucket |
|---|---|---|
| `/admin/dashboard` | `tests/admin/admin-dashboard-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/admin/applications` + `/admin/applications/[id]` | `tests/admin/admin-applications-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/admin/users` + `/admin/users/create` | `tests/admin/admin-users-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/admin/gigs` + success states | `tests/admin/admin-gigs-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/admin/client-applications` | `tests/admin/admin-client-applications-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/admin/diagnostic` | `tests/admin/admin-diagnostic-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/admin/moderation` | `tests/admin/admin-moderation-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/admin/talent` | `tests/admin/admin-talent-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:admin-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| Admin role invariant API contract | `tests/admin/admin-role-guardrail.spec.ts` | `test:qa:admin-routes`, `test:qa:focused-routes` |
| Admin Career Builder invite API contract | `tests/admin/admin-invite-career-builder-route.spec.ts` | `test:qa:admin-routes`, `test:qa:focused-routes` |
| `/client/dashboard` | `tests/client/client-dashboard-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:client-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/client/profile` | `tests/client/client-profile-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:client-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/client/applications` | `tests/client/client-applications-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:client-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/client/bookings` | `tests/client/client-bookings-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:client-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/client/gigs` | `tests/client/client-gigs-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:client-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| Client mobile drawer guardrails | `tests/client/client-drawer-guardrail.spec.ts` | `test:qa:client-routes`, `test:qa:client-drawer`, `test:qa:focused-routes` |
| `/talent/dashboard` | `tests/talent/talent-dashboard-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:talent-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/talent/profile` | `tests/talent/talent-profile-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:talent-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/talent/applications` | `tests/talent/talent-applications-route.spec.ts` (includes `390x844` mobile tab/overflow guardrail) | `test:qa:talent-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/talent/gigs` | `tests/talent/talent-gigs-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:talent-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/talent/gigs/[id]` | `tests/talent/talent-gig-detail-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:talent-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/talent/settings/billing` | `tests/talent/talent-billing-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:talent-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| `/talent/subscribe` (+ success/cancelled) | `tests/talent/talent-subscribe-route.spec.ts` (includes `390x844` mobile shell/overflow guardrail) | `test:qa:talent-routes`, `test:qa:focused-routes`, `test:qa:mobile-guardrails` |
| Auth routing/recovery guardrails (`/choose-role`, `/reset-password`, `/update-password` signed-out + signed-in hash/query recovery modes, suspended enforcement) | `tests/auth/auth-regressions.spec.ts` | `test:qa:auth-regressions` |
| Invite callback/admin invite/existing-user fallback continuity (`/api/admin/invite-career-builder`, `/auth/callback` -> `/client/apply` -> pending revisit) | `tests/admin/admin-invite-career-builder-route.spec.ts`, `tests/auth/auth-regressions.spec.ts`, `tests/auth/invite-client-apply-flow.spec.ts` | `test:qa:invite-auth` |
| `/api/stripe/webhook` failure-path contract (missing/invalid signature safety response) | `tests/api/stripe-webhook-route.spec.ts` | `test:qa:stripe-webhook-route`, `test:qa:critical-auto` |

---

## Legacy suite quarantine map

- `tests/client/client-functionality.spec.ts` is intentionally skipped; ownership replaced by:
  - `client-dashboard-route`, `client-profile-route`, `client-applications-route`, `client-bookings-route`, `client-gigs-route`, `client-drawer-guardrail`.
- `tests/talent/talent-functionality.spec.ts` is intentionally skipped; ownership replaced by:
  - `talent-dashboard-route`, `talent-profile-route`, `talent-applications-route`, `talent-gigs-route`, `talent-gig-detail-route`, `talent-billing-route`, `talent-subscribe-route`.
- `tests/admin/admin-functionality.spec.ts` is intentionally skipped; ownership replaced by:
  - `admin-dashboard-route`, `admin-applications-route`, `admin-users-route`, `admin-gigs-route`, `admin-client-applications-route`, `admin-diagnostic-route`, `admin-role-guardrail`, `admin-invite-career-builder-route`, `admin-moderation-route`, `admin-talent-route`.

---

## Remaining non-automated QA scope

- Physical/mobile client drawer validation:
  - Open/close behavior
  - Inert backdrop behavior
  - Close on route change
  - Role-scoped links sanity
  - Runbook: `docs/qa/CLIENT_DRAWER_MANUAL_VALIDATION_RUNBOOK_2026-03-04.md`
- Production validation:
  - Real reset-link flow (`signed-out`, `signed-in`)
  - Suspended-user routing confirmation in deployed environment
  - Runbook: `docs/qa/PRODUCTION_AUTH_RECOVERY_VALIDATION_RUNBOOK_2026-03-04.md`

