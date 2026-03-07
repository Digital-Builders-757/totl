## Auth red-zone (check when auth routing, onboarding gates, or Supabase flows change)

- [ ] Signed-out `/choose-role` does **not** redirect to `/login`
- [ ] `/update-password` accepts both **query-token** and **hash-token** recovery links (no premature server redirect)
- [ ] Auth-safe route lists are not duplicated (must use the canonical `AUTH_ROUTES` / `isAuthRoute()` contract)

## Test evidence

- [ ] Playwright: relevant spec(s) run locally or in CI
- [ ] If behavior changed intentionally, docs updated (contracts + troubleshooting)

## UI contract gate (required for terminal chrome/density/filter changes)

- [ ] `docs/UI_CONSTITUTION.md` reviewed (no law conflicts)
- [ ] `docs/UI_IMPLEMENTATION_INDEX.md` updated OR existing mapped primitive reused
- [ ] `docs/development/UI_CONTRACT_DRIFT_LEDGER.md` row updated (owner/status/PR)
- [ ] Route Evidence Bundle attached for touched routes:
  - [ ] `390x844`
  - [ ] `360x800`
  - [ ] `1440x900`
- [ ] No red-zone files touched for UI-only remediation
