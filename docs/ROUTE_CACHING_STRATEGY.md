# Route Caching Strategy

**Date:** January 20, 2026  
**Purpose:** Document explicit caching strategy for all routes

---

## Caching Principles

- **Public pages:** Use ISR (Incremental Static Regeneration) for CDN caching
- **Auth pages:** Always dynamic (user-specific, session-dependent)
- **Dashboards:** Always dynamic (user-specific data, real-time updates)
- **Admin pages:** Always dynamic (sensitive, real-time data)

---

## Route-by-Route Strategy

### Public Routes (ISR)

| Route | Revalidate | Reason |
|-------|------------|--------|
| `/` (home) | 3600s (1 hour) | Static marketing content, changes infrequently |
| `/gigs/[id]` | 300s (5 min) | Public gig details, only active gigs shown, acceptable staleness |
| `/talent/[slug]` | 600s (10 min) | Public talent profiles, updates infrequently |
| `/about` | 3600s (1 hour) | Static content |

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
- ✅ Public gig detail (`/gigs/[id]`) - ISR with 5 min revalidate
- ✅ Public talent profile (`/talent/[slug]`) - ISR with 10 min revalidate
- ✅ All auth routes - Explicit `dynamic = "force-dynamic"`
- ✅ All dashboard routes - Explicit `dynamic = "force-dynamic"`
- ✅ All protected routes - Explicit `dynamic = "force-dynamic"`

---

## Notes

- ISR pages are cached at CDN edge (Vercel) for faster global delivery
- Revalidate times balance freshness vs. performance
- Dynamic routes always fetch fresh data (no caching)
- Dashboard routes will be optimized via Server Component data fetching (Phase 2)
