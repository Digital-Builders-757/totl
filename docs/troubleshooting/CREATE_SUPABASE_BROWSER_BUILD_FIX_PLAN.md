# Plan: Eliminate `createSupabaseBrowser()` Server-Side Call Errors

**Created:** January 2025  
**Status:** DESIGN ONLY  
**Purpose:** Comprehensive plan to eliminate build-time errors from `createSupabaseBrowser()` being called during server-side rendering/prerendering, even in client components.

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiable boundaries
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation spine
- ✅ `database_schema_audit.md` - Schema truth (not directly relevant but reviewed)
- ✅ `lib/supabase/supabase-browser.ts` - Browser client implementation
- ✅ `lib/supabase/supabase-server.ts` - Server client implementation
- ✅ `scripts/audit-client-boundaries.mjs` - Current audit script

### Canonical Mental Model
- ✅ `docs/diagrams/airport-model.md` - Airport architecture zones

**Diagrams Used:**
- **Airport Model** - To classify zones touched (Terminal/Staff boundaries)
- **No other diagrams** - This is a build-time boundary enforcement issue, not a flow/sequence issue

### Problem Statement

**Root Cause:** Client Components may render on the server for initial HTML (RSC pipeline) even though they hydrate on the client. When `createSupabaseBrowser()` is called during render (component body, module scope, or memo initializers), it executes during SSR/RSC render where `window === undefined`, causing:

```
Error: createSupabaseBrowser() can only be called in the browser
```

**Current Violations Found:**
1. `components/auth/auth-provider.tsx:106` - `const supabase = createSupabaseBrowser();` called during render (component function level)
2. `components/admin/admin-user-creation.tsx:39` - `const supabase = createSupabaseBrowser();` called during render (component function level)

**Why This Happens:**
- Client Components are still rendered server-side for initial HTML (RSC pipeline)
- `"use client"` prevents server-side execution at request time, but doesn't prevent SSR/RSC render
- Browser-only code must run after mount (in `useEffect`, event handlers, or lazy initializers)
- `createSupabaseBrowser()` checks `typeof window === 'undefined'` and throws during SSR/RSC render

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 1. **No service role in client; prefer server components for reads; no writes from client**
- **Rule:** No service role key in client bundle. Prefer server components for data reads. All mutations go through Server Actions or API Routes (never direct client writes).
- **How it limits:** Browser client (anon key) can be used for client-side reads under RLS, but must only initialize after mount, never during render

### 2. **Middleware = security only**
- **Rule:** Middleware handles allow/deny/redirect only, no business logic
- **How it limits:** This fix doesn't touch middleware, but ensures auth provider doesn't break build-time middleware execution

### 3. **All mutations are server-side**
- **Rule:** Server Actions or API Routes only for mutations
- **How it limits:** Browser client usage must be read-only (auth state, queries), never mutations

### 4. **Missing profile is a valid bootstrap state**
- **Rule:** Middleware must allow safe routes; changes must prevent redirect loops
- **How it limits:** Auth provider must handle missing profile gracefully during build/prerender without crashing

### 5. **No `select('*')`**
- **Rule:** Always select explicit columns
- **How it limits:** Not directly relevant, but ensures we maintain query discipline when fixing browser client usage

**RED ZONE INVOLVED:** YES

**Red Zones Touched:**
- **Auth/bootstrap** - `components/auth/auth-provider.tsx` is a red flag file (auth state owner)
- **Not touching:** middleware, Stripe webhooks, RLS policies, profile bootstrap triggers

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones Touched

#### **Terminal (UI Components)**
- **Why:** `auth-provider.tsx` and `admin-user-creation.tsx` are Terminal components (UI)
- **Responsibility:** Present auth state and admin UI
- **Must NOT contain:** Business logic, direct DB writes, server-side data fetching

#### **Ticketing (Supabase Auth)**
- **Why:** Browser client manages auth sessions and state
- **Responsibility:** Client-side auth state management only
- **Must NOT contain:** Server-side session management, build-time execution

### Zones NOT Touched
- **Security (middleware)** - No changes
- **Staff (Server Actions)** - No changes
- **Locks (RLS)** - No changes
- **Control Tower (admin tools)** - No changes to admin logic, only UI component fix

### Zone Violations to Avoid
- ❌ Calling browser client during build/prerender (current violation)
- ❌ Moving auth logic to server components (would break client-side auth state)
- ❌ Removing `"use client"` directive (would break client-side functionality)

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A': Lazy Initialization with Ref + Accessor (RECOMMENDED)

**High-level description:**
- Move `createSupabaseBrowser()` calls inside `useEffect` hooks
- Initialize browser client only after component mounts (client-side only)
- Use `useRef` to store client (not nullable state)
- Provide accessor function that throws if accessed before initialization
- Maintains non-nullable client invariant (no zombie states)

**Files expected to change:**
1. `components/auth/auth-provider.tsx`
   - Move `createSupabaseBrowser()` call from component function level to `useEffect`
   - Use ref: `const supabaseRef = useRef<SupabaseClient<Database> | null>(null)`
   - Initialize in `useEffect(() => { supabaseRef.current = createSupabaseBrowser(); }, [])`
   - Create accessor: `const getSupabase = () => { if (!supabaseRef.current) throw new Error("Supabase client not initialized yet"); return supabaseRef.current; }`
   - Update all `supabase` usage to use `getSupabase()` (only in effects/handlers that run after mount)

2. `components/admin/admin-user-creation.tsx`
   - Move `createSupabaseBrowser()` call to inside event handler (submit handler)
   - Create client only when form is submitted (impossible to run server-side)

**Data model impact:** None

**Key risks:**
- **Redirect loops:** Low risk - auth provider already handles loading states
- **Profile bootstrap gaps:** Low risk - initialization happens in `useEffect` which runs after mount
- **RLS enforcement:** No risk - no RLS changes
- **Stripe/webhook idempotency:** No risk - not touching Stripe

**Why this respects:**
- ✅ Constitution: No server-side execution, maintains client-only boundary, preserves non-nullable client invariant
- ✅ Airport boundaries: Stays in Terminal zone, doesn't leak to Staff
- ✅ Selected diagrams: Terminal components remain Terminal-only
- ✅ Hardening: No nullable client state, fail-fast accessor pattern

**Trade-offs:**
- Slight delay in auth initialization (runs after mount vs during render)
- Accessor throws if accessed before mount (fail-fast, prevents zombie states)

---

### Approach B: Dynamic Import with SSR Disabled

**High-level description:**
- Use Next.js `dynamic()` import with `ssr: false` for components that use browser client
- Prevents prerendering entirely for these components
- Browser client only initializes when component actually renders client-side

**Files expected to change:**
1. `app/client-layout.tsx` or parent layout
   - Wrap `AuthProvider` in `dynamic(() => import('@/components/auth/auth-provider'), { ssr: false })`

2. `components/admin/admin-user-creation.tsx`
   - Wrap in dynamic import where used, or move initialization to event handlers

**Data model impact:** None

**Key risks:**
- **Redirect loops:** Medium risk - auth provider not available during SSR could cause hydration mismatches
- **Profile bootstrap gaps:** Medium risk - delayed auth initialization could cause flash of unauthenticated content
- **RLS enforcement:** No risk
- **Stripe/webhook idempotency:** No risk

**Why this respects:**
- ✅ Constitution: Prevents server-side execution
- ⚠️ Airport boundaries: Could cause Terminal → Security boundary issues if auth state unavailable during SSR

**Trade-offs:**
- Prevents prerendering entirely (loses SEO/performance benefits)
- Could cause hydration mismatches
- Auth state unavailable during initial render

---


---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- ✅ Build completes without `createSupabaseBrowser() can only be called in the browser` errors
- ✅ Auth provider initializes correctly after component mount
- ✅ No flash of unauthenticated content (auth state loads smoothly)
- ✅ Admin user creation form works correctly
- ✅ All existing auth flows continue to work (login, signup, signout, password reset)

### Data Correctness
- ✅ Auth state is accurate (user, session, profile, role)
- ✅ Profile hydration works correctly
- ✅ No duplicate profile fetches or race conditions

### Permissions & Access Control
- ✅ RLS policies continue to enforce correctly
- ✅ Role-based routing works correctly
- ✅ Middleware redirects work correctly

### Failure Cases (What Must NOT Happen)
- ❌ Build/SSR failures due to browser client calls during render
- ❌ `createSupabaseBrowser()` called in render paths (component body, module scope, memo initializers)
- ❌ Infinite redirect loops
- ❌ Auth state stuck in loading state
- ❌ Profile not hydrating after login
- ❌ Browser client used in server components (caught by audit)
- ❌ Nullable client state (violates hardening invariant)

### Verifiable Without Reading Code
- ✅ `npm run build` completes successfully
- ✅ `npm run audit:client-boundaries` passes (enhanced to detect render-time calls)
- ✅ Application loads and auth works in browser
- ✅ No console errors about browser-only code
- ✅ Admin user creation form functions correctly
- ✅ No `createSupabaseBrowser()` calls in render paths (component body, module scope)
- ✅ All calls occur only in `useEffect` or event handlers

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path
1. **Build Test**
   - Run `npm run build`
   - Verify build completes without errors
   - Verify no `createSupabaseBrowser()` errors in build output

2. **Auth Flow Test**
   - Start dev server (`npm run dev`)
   - Navigate to `/login`
   - Sign in with valid credentials
   - Verify redirect to dashboard
   - Verify profile loads correctly
   - Verify role-based navigation works

3. **Admin User Creation Test**
   - Navigate to `/admin/users/create` (as admin)
   - Fill out form
   - Submit form
   - Verify user creation succeeds

4. **Sign Out Test**
   - Sign out from dashboard
   - Verify redirect to login
   - Verify auth state cleared

#### Edge Cases
1. **Build with Missing Env Vars**
   - Remove `NEXT_PUBLIC_SUPABASE_URL` temporarily
   - Run `npm run build`
   - Verify build fails gracefully with clear error (not browser client error)

2. **Cold Start (No Auth State)**
   - Clear browser storage
   - Navigate to protected route
   - Verify redirect to login works
   - Verify no errors in console

3. **Concurrent Tabs**
   - Open app in two tabs
   - Sign out in one tab
   - Verify other tab detects sign out and redirects

4. **Slow Network**
   - Throttle network in DevTools
   - Sign in
   - Verify auth state loads correctly even with slow network

### Automated Tests to Add/Update

1. **Build Test (CI)**
   - Add to CI pipeline: `npm run build` must pass
   - Add to CI pipeline: `npm run audit:client-boundaries` must pass

2. **Unit Test: Browser Client Guard**
   - Test that `createSupabaseBrowser()` throws when `window === undefined`
   - Test that `createSupabaseBrowser()` returns client when `window` exists

3. **Integration Test: Auth Provider**
   - Test that auth provider initializes correctly
   - Test that auth state updates on sign in/out
   - Test that profile hydrates correctly

### Explicit RED ZONE Regression Checks

1. **Auth Bootstrap**
   - Verify `ensureProfileExists()` still works correctly
   - Verify profile creation on first login works
   - Verify no redirect loops during bootstrap

2. **Middleware Integration**
   - Verify middleware still redirects correctly based on auth state
   - Verify protected routes still require authentication
   - Verify role-based routing still works

3. **Profile Hydration**
   - Verify profile loads after sign in
   - Verify profile updates correctly
   - Verify missing profile doesn't cause crashes

---

## STEP 6 — IMPLEMENTATION NOTES

### Approved Approach: **Approach A' (Lazy Initialization with Ref + Accessor)**

**Rationale:**
- Most explicit and safe
- Maintains current architecture
- Preserves non-nullable client invariant (no zombie states)
- Minimal changes required
- No breaking changes to error handling
- Clear separation of SSR/RSC render vs runtime

### Implementation Order

1. **Fix `components/auth/auth-provider.tsx`**
   - Move `createSupabaseBrowser()` to `useEffect`
   - Use `useRef` + accessor pattern (not nullable state)
   - Update all usages to use accessor (only in effects/handlers)
   - Test auth flows

2. **Fix `components/admin/admin-user-creation.tsx`**
   - Move `createSupabaseBrowser()` to submit event handler
   - Test admin user creation

3. **Enhance Audit Script**
   - Update `scripts/audit-client-boundaries.mjs` to detect render-time calls
   - Add check for `createSupabaseBrowser()` called outside `useEffect`/event handlers
   - Detect calls in component body, module scope, memo initializers

4. **Update Documentation**
   - Update `docs/MASTER_BUILD_AND_DEPLOYMENT_RULES.md`
   - Update `BUILD_AND_AUDIT_REFERENCE.md`
   - Update `docs/ARCHITECTURE_CONSTITUTION.md`
   - Update `lib/supabase/supabase-browser.ts` JSDoc

### Documentation Updates Required

1. **`docs/MASTER_BUILD_AND_DEPLOYMENT_RULES.md`**
   - Add explicit rule: "Never call `createSupabaseBrowser()` during render (component body, module scope, memo initializers)"
   - Update fix pattern to show ref + accessor pattern
   - Add SSR/RSC render vs runtime distinction

2. **`BUILD_AND_AUDIT_REFERENCE.md`**
   - Same updates as above

3. **`docs/ARCHITECTURE_CONSTITUTION.md`**
   - Add to "Practical Checks Before Writing Code":
     - "Browser client must be initialized in `useEffect` or event handlers, never during render"

4. **`lib/supabase/supabase-browser.ts`**
   - Add JSDoc warning about SSR/RSC render execution
   - Document that it should only be called in `useEffect`, `useLayoutEffect`, or event handlers

---

## IMPLEMENTATION APPROVED

**Implement Approach A' now.**
