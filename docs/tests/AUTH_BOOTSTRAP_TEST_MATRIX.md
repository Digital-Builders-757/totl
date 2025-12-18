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
| Missing profile → repair | DEV-ONLY: delete `public.profiles` row for the signed-in user, then re-login and hit a bootstrap-safe route (`/talent/dashboard`) | Use **“After profile deletion + repair”** queries in the contract | `tests/auth/missing-profile-repair.spec.ts` | ✅ Verified |
| Client application → admin approval → promotion | Submit `/client/apply`, then approve in `/admin/client-applications` | Use **“After client application approval”** queries in the contract + assert `client_applications.status='approved'` | `tests/admin/career-builder-approval-pipeline.spec.ts` | ✅ Verified |
| Guardrail: generic “update user role” must reject `client` | Attempt to set `newRole='client'` via generic admin endpoint | N/A (API-level negative proof) | `tests/admin/admin-functionality.spec.ts` (contract guardrail test) | ✅ Verified |

---

## Notes / drift traps

- Any test that changes `profiles.role` / `profiles.account_type` directly (outside bootstrap + `approveClientApplication`) is **OFF-SYNC** with the Role Promotion Boundary and must be called out in `docs/DRIFT_REPORT.md`.
