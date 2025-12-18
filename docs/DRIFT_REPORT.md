# Drift Report

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Track proven mismatches between docs/contracts and code/tests/schema. Items stay here until resolved.

---

## Auth Bootstrap + Onboarding — Test coverage gaps

Source of truth:
- Contract: `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`
- Proof ledger: `docs/tests/AUTH_BOOTSTRAP_TEST_MATRIX.md`

### GAP 1 — Missing profile → repair is not covered by Playwright
- **Expected scenario:** delete `public.profiles` then login; system repairs via `ensureProfileExists()`.
- **Status:** ✅ RESOLVED — covered by `tests/auth/missing-profile-repair.spec.ts`.

### GAP 2 — Career Builder application → admin approval → promotion not covered end-to-end
- **Expected scenario:** submit `/client/apply` → approve at `/admin/client-applications` → verify `profiles.role/account_type` promoted + `client_profiles` exists.
- **Status:** ✅ RESOLVED — covered by `tests/admin/career-builder-approval-pipeline.spec.ts`.

---

## Role Promotion Boundary vs tests (potential OFF-SYNC)

- The Role Promotion Boundary in `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` declares:
  - no UI/server action should set `profiles.role/account_type` from user input,
  - only bootstrap trigger + `approveClientApplication()` can promote to client.

### Confirmed off-sync test behavior
- `tests/admin/admin-functionality.spec.ts` previously included a “Change user role” test that selected role `"client"` via generic admin tooling.
  - **Why this was drift:** the Auth contract’s Role Promotion Boundary declares client promotion must happen only via `approveClientApplication()`.
  - **Status:** ✅ RESOLVED
  - **Fix:** replaced with a contract-aligned negative test that asserts generic `update-user-role` rejects `client`, and added an end-to-end pipeline test at `tests/admin/career-builder-approval-pipeline.spec.ts`.
