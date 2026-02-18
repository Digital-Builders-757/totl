# Build Prerender Fix Reference

**See the master documentation:** [`docs/development/MASTER_BUILD_AND_DEPLOYMENT_RULES.md`](../development/MASTER_BUILD_AND_DEPLOYMENT_RULES.md)

This file serves as a quick reference for the prerender/browser-client fix patterns.

## Quick Links

- **Master Rules:** [`docs/development/MASTER_BUILD_AND_DEPLOYMENT_RULES.md`](../development/MASTER_BUILD_AND_DEPLOYMENT_RULES.md)
- **Audit Scripts:**
  - `npm run audit:client-boundaries` - Find browser client in server files
  - `npm run audit:single-vs-maybe-single` - Find risky .single() calls
  - `npm run audit:all` - Run all audits
  - `npm run audit:quick` - Quick sanity grep

## Pre-Push Checklist

Before pushing any branch, run:

```bash
npm run pre-push:check
```

This runs:
1. Schema verification
2. Type checking
3. Build
4. Lint
5. All audits

## Common Fixes

### Browser Client in Server Component

**Error:** `createSupabaseBrowser() can only be called in the browser`

**Fix:** Use `useSupabase()` hook in client components, or ensure file has `"use client";` directive.

### Missing Profile (406 Error)

**Error:** `PGRST116` or Sentry 406 errors

**Fix:** Use `.maybeSingle()` instead of `.single()` for tables that might not exist (profiles, talent_profiles, client_profiles).

---

**Last Updated:** January 2025
