# Auth Bootstrap Test Matrix

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS (proof ledger; keep current)  
**Purpose:** Close the last “test coverage” ambiguity in the Auth Bootstrap + Onboarding contract by mapping each required scenario to:
- manual steps
- DB assertions
- Playwright coverage (or explicit GAP)

**Canonical contract:** `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`

---

## Matrix

| Scenario | Manual steps | DB assertions | Playwright spec path | Status |
|---|---|---|---|---|
| Signup → verify → talent dashboard | Use normal UI signup (`/talent/signup` or `/choose-role` → talent), confirm email, then login | Use **“After signup + email confirm”** queries in `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` | `tests/auth/create-user-and-test-auth.spec.ts` | ✅ Verified (automated verification via admin API) |
| Signup → verify → talent dashboard (pure E2E, email-link click) | Same as above, but click email link (real inbox) | Same as above | `tests/auth/complete-auth-flow.spec.ts` and `tests/auth/post-verification-login-flow.spec.ts` | ⚠️ Partial (manual verification step) |
| Guest create-account entry must not bounce | While signed out, open `/login` and click “Create an account”; verify you stay on `/choose-role` | N/A (routing-only) | `tests/auth/authentication.spec.ts` (or dedicated auth routing spec) | ⚠️ Add regression assertion for `/choose-role` stability |
| Missing profile → repair | DEV-ONLY: delete `public.profiles` row for the signed-in user, then re-login and hit a bootstrap-safe route (`/talent/dashboard`) | Use **“After profile deletion + repair”** queries in the contract | `tests/auth/missing-profile-repair.spec.ts` | ✅ Verified |
| Client application → admin approval → promotion | Submit `/client/apply`, then approve in `/admin/client-applications` | Use **“After client application approval”** queries in the contract + assert `client_applications.status='approved'` | `tests/admin/career-builder-approval-pipeline.spec.ts` | ✅ Verified |
| Guardrail: generic “update user role” must reject `client` | Attempt to set `newRole='client'` via generic admin endpoint | N/A (API-level negative proof) | `tests/admin/admin-functionality.spec.ts` (contract guardrail test) | ✅ Verified |
| Password reset link with query token | Click reset email containing `?token_hash=...&type=recovery`; verify `/update-password` loads form and password update succeeds | N/A (auth token flow) | `tests/auth/authentication.spec.ts` (reset flow) | ⚠️ Partial (success path covered; add explicit signed-in bounce assertion) |
| Password reset link with hash tokens | Open `/update-password#access_token=...&refresh_token=...&type=recovery`; verify client gate state machine handles checking/failed/ready and does not bounce to `/login` | N/A (auth token flow) | `tests/auth/auth-regressions.spec.ts` | ✅ Verified (routing + gate regression) |
| Password recovery after `SIGNED_IN` (no auth-route bounce) | Start recovery flow, ensure `SIGNED_IN` occurs during token exchange, verify user remains on `/update-password` (including refresh) until update completes | N/A (auth token flow) | `tests/auth/auth-regressions.spec.ts` + manual refresh check | ⚠️ Partial (automated routing proof; add explicit refresh-with-real-token e2e) |

---

## Notes / drift traps

- Any test that changes `profiles.role` / `profiles.account_type` directly (outside bootstrap + `approveClientApplication`) is **OFF-SYNC** with the Role Promotion Boundary and must be called out in `docs/DRIFT_REPORT.md`.
- Do not ship auth-route edits without proving middleware and auth-provider both use `isAuthRoute()` for auth-safe no-session behavior.
- Do not ship `/update-password` edits without testing both query-token and hash-token link modes.
- Do not ship auth-route redirect changes without proving `/update-password` recovery intent remains exempt from post-`SIGNED_IN` convergence.
