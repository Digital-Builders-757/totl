# Talent Dashboard Auth & Data Pattern (Dec 2025)

## Principles
- AuthProvider is the single source of truth for session, profile, userRole, isLoading, isEmailVerified. Profile creation/hydration happens via `ensureProfileExists()` inside auth flows.
- Middleware only gates by session/role/suspension; it never creates profiles. Safe routes (`/talent/dashboard`, auth/public/onboarding) are allowed through even if profile is missing.
- Server pages for dashboards are thin shells that render the client component. No server-side profile redirects.
- Client dashboards read `useAuth()` for auth state, use one data hook for data/state/errors, and have a single loading gate.
- `router.refresh()` is used intentionally, not as a retry hammer; no `window.location.reload()`.

## Implementation (talent dashboard)
- Server page: `app/talent/dashboard/page.tsx` exports `dynamic = "force-dynamic"` and renders `<DashboardClient />`.
- Middleware: allows authenticated users without a profile to reach `/talent/dashboard`; still protects `/client/*` and `/admin/*`.
- Data hook: `useTalentDashboardData({ user, profile, authLoading })` in `app/talent/dashboard/client.tsx` owns:
  - `talentProfile`, `applications` (with `gigs(..., client_profiles(company_name))`), `gigs`
  - `dataLoading`, `dataError`, `fatalError`, `refetch()` (reload token), cancellable effect (no timeouts)
  - Creates a minimal talent_profile when role/account_type indicates talent and none exists
- Loading gate: `authLoading || dataLoading || isInVerificationGracePeriodRef.current`.
- Errors:
  - `fatalError` → full-screen config error (e.g., Supabase misconfigured).
  - `dataError` → stays in-dashboard (loading UI + Discover tab “Try Again” → `refetch()`).
- Verification grace: keeps `verified=true` handling, sets grace ref, calls `router.refresh()`, and cleans the URL after delay; redirect guard skips while grace is active.
- “Finishing your setup” screen: shown when `user && !profile`; Retry calls `ensureProfileExists()` then `refetch()` + `router.refresh()`.

## How to reuse for other dashboards
1) Server page: render the client component only.
2) Middleware: allow safe routes through when profile is missing; gate role-only routes.
3) Client: consume `useAuth()`; add a `useXDashboardData` hook that owns all data/loading/errors/refetch with a cancellable effect (no timeouts); single loading gate; dataError stays local, fatalError only for config.
4) Retry buttons call `refetch()` (optionally `router.refresh()` when auth/session needs a fresh cache), never `window.location.reload()`.

## Quick regression checks
- Signup → verify → `/talent/dashboard`: loads or shows “Finishing your setup” with working Retry.
- Supabase env missing: fatal config screen, no spinner loop.
- Break gigs query: Discover tab shows `dataError` EmptyState with Try Again → `refetch()`.
- Sign out: “Signing Out…” then `/login?signedOut=true`.

