## Auth red-zone (check when auth routing, onboarding gates, or Supabase flows change)

- [ ] Signed-out `/choose-role` does **not** redirect to `/login`
- [ ] `/update-password` accepts both **query-token** and **hash-token** recovery links (no premature server redirect)
- [ ] Auth-safe route lists are not duplicated (must use the canonical `AUTH_ROUTES` / `isAuthRoute()` contract)

## Test evidence

- [ ] Playwright: relevant spec(s) run locally or in CI
- [ ] If behavior changed intentionally, docs updated (contracts + troubleshooting)
