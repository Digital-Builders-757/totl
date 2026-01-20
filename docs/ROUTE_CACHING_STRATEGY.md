# Route Caching Strategy

**Date:** January 20, 2026  
**Purpose:** Document explicit caching strategy for all routes

---

## Caching Principles

- **Public pages:** Use ISR (Incremental Static Regeneration) for CDN caching **only if they don't use request-bound APIs** (`cookies()`, `headers()`, `searchParams`)
- **Routes using `createSupabaseServer()`:** Always dynamic (uses `cookies()` which requires dynamic rendering)
- **Auth pages:** Always dynamic (user-specific, session-dependent)
- **Dashboards:** Always dynamic (user-specific data, real-time updates)
- **Admin pages:** Always dynamic (sensitive, real-time data)

**Critical Rule:** Any route using `createSupabaseServer()` (cookies/session) is treated as dynamic; ISR is not applied.

---

## Route-by-Route Strategy

### Public Routes (ISR)

| Route | Revalidate | Reason |
|-------|------------|--------|
| `/` (home) | 3600s (1 hour) | Static marketing content, changes infrequently |
| `/about` | 3600s (1 hour) | Static content |

### Routes Using `createSupabaseServer()` (Always Dynamic)

| Route | Config | Reason |
|-------|--------|--------|
| `/gigs/[id]` | `dynamic = "force-dynamic"` | Uses `createSupabaseServer()` for session checks and user-specific data (application status, client details visibility) |
| `/talent/[slug]` | `dynamic = "force-dynamic"` | Uses `createSupabaseServer()` for session checks and sensitive field access control |

### Auth Routes (Always Dynamic)

| Route | Config | Reason |
|-------|--------|--------|
| `/login` | `dynamic = "force-dynamic"` | Session-dependent, user-specific |
| `/signup` | `dynamic = "force-dynamic"` | User creation, no caching |
| `/auth/callback` | `dynamic = "force-dynamic"` | OAuth callback, session establishment |
| `/reset-password` | `dynamic = "force-dynamic"` | Password reset flow |
| `/update-password` | `dynamic = "force-dynamic"` | Password update flow |

### Dashboard Routes (Always Dynamic)

| Route | Config | Reason |
|-------|--------|--------|
| `/talent/dashboard` | `dynamic = "force-dynamic"` | User-specific data, real-time updates |
| `/client/dashboard` | `dynamic = "force-dynamic"` | User-specific data, real-time updates |
| `/admin/dashboard` | `dynamic = "force-dynamic"` | Admin data, sensitive, real-time |

### Protected Routes (Always Dynamic)

| Route | Config | Reason |
|-------|--------|--------|
| `/gigs` (list) | `dynamic = "force-dynamic"` | Requires sign-in, user-specific filtering |
| `/client/gigs` | `dynamic = "force-dynamic"` | User-specific gigs |
| `/client/applications` | `dynamic = "force-dynamic"` | User-specific applications |
| `/talent/profile` | `dynamic = "force-dynamic"` | User-specific profile |
| `/settings` | `dynamic = "force-dynamic"` | User-specific settings |
| `/onboarding` | `dynamic = "force-dynamic"` | User onboarding flow |

---

## Implementation Status

- ✅ Home page (`/`) - ISR with 1 hour revalidate
- ✅ Public gig detail (`/gigs/[id]`) - Dynamic (`force-dynamic`) - uses `createSupabaseServer()`
- ✅ Public talent profile (`/talent/[slug]`) - Dynamic (`force-dynamic`) - uses `createSupabaseServer()`
- ✅ All auth routes - Explicit `dynamic = "force-dynamic"`
- ✅ All dashboard routes - Explicit `dynamic = "force-dynamic"`
- ✅ All protected routes - Explicit `dynamic = "force-dynamic"`

---

## Notes

- ISR pages are cached at CDN edge (Vercel) for faster global delivery
- Revalidate times balance freshness vs. performance
- Dynamic routes always fetch fresh data (no caching)
- **Routes using `createSupabaseServer()` cannot use ISR** because they access `cookies()` which requires dynamic rendering
- Dashboard routes will be optimized via Server Component data fetching (Phase 2)
- Future optimization: Routes like `/gigs/[id]` and `/talent/[slug]` could be refactored to split public data (ISR) from user-specific data (dynamic client component) if performance becomes critical
