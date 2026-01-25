# Performance Optimization Plan — "Snappy" Initiative

**Date:** January 20, 2026  
**Status:** DESIGN ONLY  
**Purpose:** Comprehensive performance optimization plan for Next.js App Router + Supabase + Vercel + Sentry stack to achieve "snappy" user experience

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiable architectural boundaries
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation spine
- ✅ `database_schema_audit.md` - Schema truth (indexes, RLS policies)
- ✅ `next.config.mjs` - Current Next.js configuration (caching, images)
- ✅ `sentry.edge.config.ts`, `sentry.server.config.ts`, `instrumentation-client.ts` - Sentry configuration
- ✅ `app/client/dashboard/page.tsx` - Client dashboard data fetching patterns
- ✅ `app/talent/dashboard/client.tsx` - Talent dashboard data fetching patterns
- ✅ `middleware.ts` - Security/routing gate
- ✅ `supabase/migrations/**` - RLS policies and indexes

### Canonical Mental Model
- ✅ `docs/diagrams/airport-model.md` - Airport architecture zones

### Selected Diagrams (and WHY)
- **Airport Model** (`docs/diagrams/airport-model.md`): Performance touches **Security** (middleware cookie reads), **Terminal** (UI rendering/caching), **Staff** (Server Actions/API routes data fetching), **Locks** (RLS query performance), and **Control Tower** (monitoring/Sentry).
- **Infrastructure Flow** (`docs/diagrams/infrastructure-flow.md`): Relevant for understanding data flow paths (Server Actions → Supabase → RLS) and where caching can be applied.
- **Signup Bootstrap Flow** (`docs/diagrams/signup-bootstrap-flow.md`): Relevant for auth transition performance (sign-in/out redirects, profile bootstrap).

### Current State Analysis
**Sentry Configuration:**
- ✅ Traces enabled (`tracesSampleRate: 0.1` production, `1.0` dev)
- ❌ **Web Vitals NOT explicitly enabled** (missing `browserTracingIntegration` with web vitals)
- ✅ Session Replay enabled (`replaysOnErrorSampleRate: 0.1`, `replaysSessionSampleRate: 0.1`)
- ✅ Source maps uploaded (`widenClientFileUpload: true`)

**Next.js Configuration:**
- ✅ Image optimization enabled (`unoptimized: false`)
- ✅ WebP/AVIF formats configured
- ❌ **No explicit route caching strategy** (no `export const revalidate`, `export const dynamic`)
- ❌ **No ISR configuration** for public pages

**Data Fetching Patterns:**
- ✅ Explicit column selects (no `select('*')`)
- ⚠️ **Client-side data fetching** in dashboards (`useEffect` hooks with multiple sequential queries)
- ⚠️ **Potential N+1 patterns**: Client dashboard fetches `client_profiles`, then `gigs`, then `applications` separately
- ⚠️ **No server-side aggregation** for dashboard summaries

**RLS & Indexes:**
- ✅ RLS policies exist on all tables
- ⚠️ **Index audit needed**: Need to verify indexes exist on columns used in RLS predicates (`auth.uid()`, `user_id`, `client_id`, `talent_id`)
- ⚠️ **No explicit FK indexes** verified (Supabase may auto-create, but needs audit)

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 1. **Middleware = security only**
- **Rule:** Allow/deny/redirect only. No business logic. No DB writes.
- **Impact:** Performance optimizations in middleware must be limited to **cookie read caching** or **route matching optimization**. Cannot add DB queries or business logic to speed up middleware.

### 2. **All mutations are server-side**
- **Rule:** Server Actions or API Routes only for mutations.
- **Impact:** Performance optimizations for data writes must stay in Server Actions/API Routes. Cannot move mutations to client components even if it would be "faster" (would violate security).

### 3. **No DB calls in client components**
- **Rule:** No writes and no privileged reads.
- **Impact:** Dashboard data fetching optimizations must either:
  - Move to Server Components (RSC) with explicit caching
  - Keep client-side reads but optimize query patterns (aggregate queries, reduce round trips)
  - Cannot bypass RLS or use service role in client components

### 4. **RLS is final authority**
- **Rule:** Never bypass RLS with service role in client/browser code.
- **Impact:** Performance optimizations must work **within RLS constraints**. Indexes on RLS predicate columns are the correct approach. Cannot bypass RLS for speed.

### 5. **Prefer minimal diffs**
- **Rule:** Especially in red flag files (middleware, auth-provider, signout route).
- **Impact:** Performance changes should be **additive** (new indexes, new caching configs) rather than refactoring core auth/routing logic. Changes to dashboards can be more substantial if they improve UX without breaking auth flows.

### RED ZONE INVOLVED: **YES**

**Red zones touched:**
- **middleware** - Cookie read performance (read-only, no mutations)
- **auth/callback** - Not directly, but sign-in/out transition performance affects UX
- **profile bootstrap** - Dashboard loading performance during profile creation race conditions
- **RLS / triggers / policies** - Index optimization for RLS predicates (additive, no policy changes)

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Security Zone (middleware.ts)
**What it does:**
- Reads cookies via `createServerClient` to check `supabase.auth.getUser()`
- Makes routing decisions based on session + profile
- Runs on every request (critical path)

**Performance opportunities:**
- ✅ **Cookie read caching** (Next.js middleware can cache cookie reads within request lifecycle)
- ✅ **Route matching optimization** (early returns for public routes before auth checks)
- ❌ **Cannot add DB queries** (would violate "security only" rule)

**What must stay OUT:**
- DB queries (even for performance)
- Business logic
- Data fetching

### Terminal Zone (UI pages & components)
**What it does:**
- Renders dashboards, public pages, auth pages
- Displays data from Server Components or client hooks
- Handles user interactions

**Performance opportunities:**
- ✅ **Server Components** for initial data load (RSC can fetch server-side, cache, stream)
- ✅ **Suspense boundaries** for progressive rendering (show shell immediately, stream data)
- ✅ **Static/ISR** for public pages (gigs list, landing page)
- ✅ **Dynamic imports** for heavy client components (charts, editors, tables)
- ✅ **Image optimization** (already configured, verify usage)

**What must stay OUT:**
- Direct Supabase client creation during render (already prevented by `useSupabase` hook)
- DB mutations (must use Server Actions)

### Staff Zone (Server Actions / API Routes)
**What it does:**
- Fetches data from Supabase (under RLS)
- Aggregates data for dashboards
- Handles mutations

**Performance opportunities:**
- ✅ **Aggregate queries** (single RPC/view for dashboard summaries instead of N+1)
- ✅ **Explicit caching** (`revalidate`, `cache: 'force-cache'` for stable data)
- ✅ **Streaming responses** (use `loading.tsx` + Suspense to show UI while data loads)
- ✅ **Query batching** (fetch multiple related records in single query with joins)

**What must stay OUT:**
- Bypassing RLS (must work within RLS constraints)
- Client-side DB calls (already prevented)

### Locks Zone (RLS / DB constraints / triggers)
**What it does:**
- Enforces row-level security policies
- Evaluates `auth.uid()` predicates on every query
- Uses indexes to speed up policy evaluation

**Performance opportunities:**
- ✅ **Index columns used in RLS predicates** (`user_id`, `client_id`, `talent_id`, `auth.uid()` comparisons)
- ✅ **Index foreign keys** (FK indexes speed up joins used in RLS policies)
- ✅ **Composite indexes** for common query patterns (e.g., `(user_id, status)` for applications)
- ✅ **Supabase Performance Advisor** to identify missing indexes

**What must stay OUT:**
- Changing RLS policies for performance (security must not be compromised)
- Bypassing RLS (violates Constitution)

### Control Tower Zone (Admin tools / monitoring / webhooks)
**What it does:**
- Sentry error tracking and performance monitoring
- Webhook handlers (Stripe)
- Admin dashboards

**Performance opportunities:**
- ✅ **Enable Web Vitals in Sentry** (`browserTracingIntegration` with web vitals)
- ✅ **Performance budgets** (track LCP, INP, CLS baselines)
- ✅ **Query performance monitoring** (Sentry can track slow Supabase queries)

**What must stay OUT:**
- Changing webhook idempotency (Stripe webhooks must remain safe to retry)

### Ticketing Zone (Supabase Auth / Stripe)
**What it does:**
- Manages sessions (cookies + localStorage)
- Handles auth state changes

**Performance opportunities:**
- ✅ **Session cookie optimization** (ensure cookies are HTTP-only, secure, SameSite)
- ✅ **Auth transition optimization** (use `router.refresh()` vs hard redirect appropriately)
- ❌ **Cannot change auth flow** (Supabase Auth is external service)

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: **Measurement-First + Incremental Wins** (RECOMMENDED)

**High-level description:**
Start with Sentry Web Vitals instrumentation to establish baselines, then apply low-risk optimizations (indexes, caching configs) before refactoring dashboards.

**Files expected to change:**
1. **Sentry configs** (`instrumentation-client.ts`, `sentry.server.config.ts`):
   - Add `browserTracingIntegration` with web vitals enabled
   - Add performance monitoring helpers

2. **Database migrations** (`supabase/migrations/YYYYMMDDHHMMSS_add_rls_performance_indexes.sql`):
   - Add indexes on RLS predicate columns (`user_id`, `client_id`, `talent_id`)
   - Add FK indexes if missing
   - Add composite indexes for common query patterns

3. **Next.js route configs** (add `export const revalidate` / `export const dynamic`):
   - Public pages: `app/page.tsx`, `app/gigs/page.tsx` → `revalidate: 3600` (ISR)
   - Auth pages: `app/login/page.tsx`, `app/(auth)/**` → `dynamic: 'force-dynamic'` (always fresh)
   - Dashboards: `app/talent/dashboard/page.tsx`, `app/client/dashboard/page.tsx` → `dynamic: 'force-dynamic'` (keep current behavior, add explicit)

4. **Dashboard Server Components** (new files or refactor):
   - `app/talent/dashboard/page.tsx` → Add Server Component data fetching with Suspense
   - `app/client/dashboard/page.tsx` → Add Server Component data fetching with Suspense
   - Create `app/talent/dashboard/loading.tsx`, `app/client/dashboard/loading.tsx` for streaming UI

5. **Performance ledger doc** (`docs/PERFORMANCE_BASELINE.md`):
   - Document baseline metrics (LCP, INP, CLS)
   - Track improvements per optimization

**Data model impact:**
- **Additive indexes only** (no schema changes)
- No RLS policy changes
- No table structure changes

**Key risks:**
- ✅ **Low risk**: Indexes are additive, cannot break existing queries
- ✅ **Low risk**: Sentry config changes are additive
- ⚠️ **Medium risk**: Moving dashboard data fetching to Server Components requires careful testing of auth state (ensure `useAuth()` still works in client components that consume server data)
- ⚠️ **Medium risk**: ISR on public pages must respect RLS (public pages should work for anon users)

**Why this approach respects:**
- ✅ **Constitution**: No middleware changes, no RLS bypasses, mutations stay server-side
- ✅ **Airport boundaries**: Changes are scoped to Terminal (UI), Staff (Server Components), Locks (indexes), Control Tower (Sentry)
- ✅ **Minimal diffs**: Indexes and configs are additive; dashboard refactoring can be incremental

---

### Approach B: **Aggressive Server Component Migration**

**High-level description:**
Immediately refactor all dashboards to Server Components with streaming, then add indexes and monitoring.

**Files expected to change:**
1. **All dashboard pages** → Convert to Server Components
2. **Data fetching hooks** → Move to Server Actions or Server Component async functions
3. **Client components** → Become presentational only (receive data as props)
4. **Indexes and Sentry** → Same as Approach A

**Data model impact:**
- Same as Approach A (indexes only)

**Key risks:**
- ⚠️ **High risk**: Large refactor touches auth-dependent code (must ensure `useAuth()` patterns still work)
- ⚠️ **High risk**: Client components that currently use `useAuth()` may need props drilling or context changes
- ⚠️ **Medium risk**: Streaming/Suspense boundaries must be tested for auth state transitions

**Why this approach respects:**
- ✅ **Constitution**: Still respects all rules, but larger surface area for bugs
- ✅ **Airport boundaries**: Same zones as Approach A
- ❌ **Minimal diffs**: Violates "prefer minimal diffs" — this is a large refactor

---

### Approach C: **Indexes + Caching Only (No Refactoring)**

**High-level description:**
Add indexes and Next.js caching configs only. Keep current client-side data fetching but optimize queries.

**Files expected to change:**
1. **Database migrations** → Indexes only
2. **Next.js route configs** → `revalidate` / `dynamic` exports
3. **Sentry configs** → Web Vitals
4. **Dashboard queries** → Optimize to reduce N+1 (combine queries where possible, but keep client-side)

**Data model impact:**
- Indexes only (same as Approach A)

**Key risks:**
- ✅ **Low risk**: Minimal code changes
- ⚠️ **Medium risk**: Client-side fetching will always be slower than Server Components (cannot achieve "snappy" without RSC)
- ⚠️ **Low risk**: May not achieve target performance improvements without dashboard refactoring

**Why this approach respects:**
- ✅ **Constitution**: Fully respects all rules
- ✅ **Airport boundaries**: Same zones
- ✅ **Minimal diffs**: Most conservative approach

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### Measurement & Baseline
- ✅ **Sentry Web Vitals enabled** and reporting LCP, INP, CLS metrics
- ✅ **Performance ledger created** (`docs/PERFORMANCE_BASELINE.md`) with baseline metrics for:
  - Login page (first paint)
  - Talent Dashboard (LCP, INP, data load time)
  - Client Dashboard (LCP, INP, data load time)
  - Public gigs list (LCP, if public)
- ✅ **Target improvements defined** (e.g., "LCP < 2.5s", "INP < 200ms", "Dashboard data load < 1s")

### Database Performance
- ✅ **RLS predicate indexes verified** (all columns used in `auth.uid()`, `user_id`, `client_id`, `talent_id` comparisons have indexes)
- ✅ **FK indexes verified** (all foreign keys have indexes)
- ✅ **Composite indexes added** for common query patterns (e.g., `(user_id, status)` for applications)
- ✅ **Supabase Performance Advisor run** and warnings addressed

### Rendering & Caching Strategy
- ✅ **Route-by-route caching documented** (`docs/ROUTE_CACHING_STRATEGY.md`):
  - Public pages: ISR with `revalidate` (if applicable)
  - Auth pages: `dynamic: 'force-dynamic'`
  - Dashboards: `dynamic: 'force-dynamic'` (explicit, even if default)
- ✅ **Public pages use ISR** where possible (gigs list, landing page)
- ✅ **Dashboards stream critical UI first** (Suspense boundaries + `loading.tsx`)

### Data Fetching Optimization
- ✅ **No N+1 patterns on dashboards** (verified via Sentry query tracing)
- ✅ **Dashboard queries aggregated** (single query or RPC for dashboard summaries where possible)
- ✅ **Explicit column selects maintained** (no `select('*')` introduced)

### Auth Transition Performance
- ✅ **Sign-in/out feels instant** (no visible loading states > 500ms)
- ✅ **Post-auth cache invalidation consistent** (`router.refresh()` vs hard redirect documented and applied correctly)
- ✅ **No redirect loops** (verified via manual testing + Sentry error monitoring)

### Bundle & Asset Optimization
- ✅ **Client bundle trimmed** (dynamic imports for heavy modules: charts, editors, tables)
- ✅ **Images optimized** (all images use `next/image` with correct sizing)
- ✅ **Fonts self-hosted** (if applicable, use `next/font`)

### Monitoring & Verification
- ✅ **Sentry performance dashboards** show improvements (LCP, INP trending down)
- ✅ **No regressions** (error rates, auth flows, redirects unchanged)
- ✅ **Manual testing** confirms "snappy" feel (subjective but important)

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path — Performance Baseline
1. **Login Performance**
   - Clear cache, navigate to `/login`
   - Measure time to first paint (LCP)
   - Measure time to interactive (INP on form focus)
   - **Target**: LCP < 1.5s, INP < 100ms

2. **Talent Dashboard Load**
   - Sign in as talent user
   - Navigate to `/talent/dashboard`
   - Measure time to shell visible (loading.tsx)
   - Measure time to data fully loaded (applications, gigs visible)
   - **Target**: Shell < 500ms, Data < 1.5s

3. **Client Dashboard Load**
   - Sign in as client user
   - Navigate to `/client/dashboard`
   - Measure time to shell visible
   - Measure time to data fully loaded (gigs, applications visible)
   - **Target**: Shell < 500ms, Data < 1.5s

4. **Public Gigs List** (if public route exists)
   - Sign out, navigate to `/gigs` (or public gigs route)
   - Measure LCP (should be fast with ISR)
   - **Target**: LCP < 2s (cached), < 3s (uncached)

#### Edge Cases — Performance Under Load
5. **Auth Transition Performance**
   - Sign in → measure redirect time to dashboard
   - Sign out → measure redirect time to login
   - **Target**: < 500ms transition time

6. **Dashboard with Many Records**
   - Create test data: 50+ applications, 20+ gigs
   - Load dashboard → measure query time
   - **Target**: < 2s even with large datasets (indexes should help)

7. **Concurrent Requests**
   - Open dashboard in multiple tabs
   - Verify no performance degradation
   - **Target**: Each tab loads independently, no blocking

#### Regression Checks — RED ZONE Safety
8. **Auth Flow Integrity**
   - Sign in → verify redirect to correct dashboard (talent/client)
   - Sign out → verify redirect to login
   - Verify no redirect loops
   - Verify profile bootstrap still works

9. **RLS Enforcement**
   - Sign in as talent → verify cannot access client data
   - Sign in as client → verify cannot access other client's data
   - Verify indexes don't break RLS (run Supabase Performance Advisor)

10. **Middleware Performance**
    - Verify middleware cookie reads are fast (< 50ms)
    - Verify public routes don't trigger auth checks unnecessarily

### Automated Tests to Add or Update

#### Performance Monitoring Tests
1. **Sentry Web Vitals Integration Test**
   - Verify Web Vitals are being sent to Sentry
   - Test file: `tests/integration/sentry-web-vitals.test.ts` (new)
   - Assert: Web Vitals events appear in Sentry test environment

2. **Dashboard Query Performance Test**
   - Test file: `tests/integration/dashboard-performance.test.ts` (new)
   - Mock Supabase queries, measure query count and timing
   - Assert: No N+1 patterns (single query or < 3 queries for dashboard load)

3. **Route Caching Test**
   - Test file: `tests/integration/route-caching.test.ts` (new)
   - Verify ISR pages return cached responses after revalidate period
   - Verify dynamic pages always fetch fresh data

#### RED ZONE Regression Tests
4. **Auth Redirect Test** (update existing)
   - Test file: `tests/auth/redirect-flow.test.ts` (verify exists)
   - Assert: No redirect loops, correct role-based routing

5. **RLS Policy Test** (update existing)
   - Test file: `tests/integration/rls-enforcement.test.ts` (verify exists)
   - Assert: RLS policies still enforce correctly after index additions

### Explicit RED ZONE Regression Checks

#### Middleware
- ✅ **Cookie read performance**: Middleware should read cookies in < 50ms (no DB queries added)
- ✅ **Route matching**: Public routes should skip auth checks (early return)

#### Auth/Callback
- ✅ **Sign-in redirect**: Should redirect to correct dashboard within 500ms
- ✅ **Sign-out redirect**: Should redirect to login within 500ms
- ✅ **No redirect loops**: Test sign-in → dashboard → sign-out → login flow

#### Profile Bootstrap
- ✅ **Profile creation race**: Dashboard should handle missing profile gracefully (show "finishing setup" screen)
- ✅ **Profile load performance**: Profile fetch should complete in < 500ms

#### RLS / Triggers / Policies
- ✅ **RLS enforcement**: Indexes should not break RLS (run Supabase Performance Advisor)
- ✅ **Query performance**: RLS predicate evaluation should be fast (< 100ms with indexes)

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

**Recommendation: Approach A (Measurement-First + Incremental Wins)**

**Rationale:**
- Lowest risk (additive changes: indexes, configs)
- Establishes baseline metrics before optimization (measure → hypothesis → fix → verify)
- Allows incremental dashboard refactoring after proving indexes help
- Respects Constitution and minimal diffs principle
- Can achieve "snappy" with Server Component migration in Phase 2 if needed

**Suggested Phases:**
- **Phase 1** (Approach A, Steps 1-3): Sentry Web Vitals + Indexes + Route Caching Configs
- **Phase 2** (if Phase 1 doesn't achieve targets): Dashboard Server Component Migration
- **Phase 3** (ongoing): Bundle optimization, image optimization, font optimization
