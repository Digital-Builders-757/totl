# Soft Launch Runbook (Go/No-Go + Rollback)

Date: 2026-03-05  
Owner: Product + Engineering + QA

## Objective
Ship the launch candidate safely with explicit go/no-go gates, observability checks, and a rollback path.

## Pre-Go Gates (must all pass)
- `npm run security:check` passes.
- `npm run build` passes (warnings documented, no blockers).
- `npm run test:qa:focused-routes` passes.
- Beta dry-run evidence recorded in `PAST_PROGRESS_HISTORY.md`.
- At least one external beta session result logged (PASS or PASS WITH NOTES).

## Launch Window Checklist
1. Confirm deploy target and commit SHA.
2. Confirm environment variables are present for target environment.
3. Confirm Supabase and Stripe operational status.
4. Announce launch window in team channel with owner assignments.
5. Deploy release through normal pipeline.

## Immediate Post-Deploy Validation (first 30 minutes)
- Verify public pages load: `/`, `/about`, `/choose-role`.
- Verify auth path: `/login`, role redirect behavior, protected route guard.
- Verify talent billing/subscribe path: `/talent/subscribe`, `/talent/billing`.
- Verify admin core panels: `/admin/dashboard`, `/admin/applications`, `/admin/moderation`.
- Verify no P0/P1 errors in logs (Sentry + runtime logs).

## Monitoring Checklist (first 24 hours)
- Watch Sentry for auth/middleware/server-action spikes.
- Watch API route error rates (`/api/admin/*`, `/api/stripe/webhook`, `/api/client-applications/status`).
- Watch user-reported issues from beta/early users and classify by severity.

## Severity and Response
- `P0` (blocker): activate rollback immediately.
- `P1` (major): decide within 30 minutes if mitigation is possible without rollback.
- `P2/P3`: keep launch active, queue fix in next patch batch.

## Rollback Triggers
- Auth/login outage across roles.
- Stripe webhook or payment flow critical failures.
- Widespread protected-route misrouting or role leakage.
- Reproducible data integrity issue on core journeys.

## Rollback Procedure
1. Declare rollback in team channel with reason and timestamp.
2. Revert to prior stable deployment version.
3. Re-run quick route validations on reverted version.
4. Log incident summary + root-cause owner in `PAST_PROGRESS_HISTORY.md`.
5. Open a follow-up fix task and block relaunch until P0/P1 is resolved.

## Evidence to Capture
- Deployment timestamp + commit SHA.
- Gate command outputs.
- First post-deploy validation checks (PASS/FAIL).
- Any incident timelines and mitigation actions.
