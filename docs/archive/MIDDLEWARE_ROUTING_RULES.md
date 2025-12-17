# Middleware Routing Rules - Single Source of Truth

**Generated:** 2025-01-XX  
**Purpose:** Complete reference for all routing and route protection logic across the application

---

## File Map

### Primary Middleware
- **`middleware.ts`** - Main Next.js middleware (runs on every request)

### Route Protection Helpers
- **`lib/actions/auth-actions.ts`** - `handleLoginRedirect()` server action (duplicates some middleware logic)
- **`components/auth/auth-provider.tsx`** - Client-side auth state management with redirects
- **`components/auth/require-auth.tsx`** - Client component wrapper for auth protection

### Route Handlers
- **`app/auth/callback/page.tsx`** - Email verification callback with redirects
- **`app/dashboard/page.tsx`** - Server component with redirect logic
- **`app/api/admin/update-user-role/route.ts`** - Example API route with auth checks

### Layouts
- **`app/layout.tsx`** - Root layout (no route protection)
- **`app/admin/layout.tsx`** - Admin layout (no route protection)
- **`app/login/layout.tsx`** - Login layout (no route protection)
- **`app/client-layout.tsx`** - Client layout wrapper (UI only, no route protection)

---

## Matcher Summary

### Middleware Matcher Configuration

**File:** `middleware.ts` (Lines 271-275)

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**What This Means:**
- ✅ **Includes:** All routes EXCEPT:
  - `/_next/static/*` - Next.js static assets
  - `/_next/image/*` - Next.js image optimization
  - `/favicon.ico` - Favicon
  - `*.svg`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp` - Image files
- ✅ **Includes:** All API routes (`/api/*`) - middleware runs but allows through
- ✅ **Includes:** All page routes
- ✅ **Includes:** All dynamic routes

**Note:** API routes are included in the matcher but bypassed early in middleware (line 37).

---

## Routing Rules Table

| Priority | Path Pattern | Request Type | Condition | Who It Applies To | Action | Redirect Destination | Cookie/Session Reads | Cookie/Session Writes | Notes / Risks |
|----------|--------------|--------------|-----------|------------------|--------|---------------------|---------------------|---------------------|---------------|
| **1** | `/_next/*`, `/favicon.ico`, `*.{svg,png,jpg,jpeg,gif,webp}` | Assets | `isAssetOrApi(path)` returns true | All | **Allow** | N/A | None | None | Early exit - no auth check |
| **2** | `/api/*` | API Routes | `path.startsWith("/api/")` | All | **Allow** | N/A | None | None | API routes bypass middleware but can implement own auth |
| **3** | Any path | All | `!supabaseUrl \|\| !supabaseAnonKey` (env vars missing) | All | **Conditional** | `/login?returnUrl={path}` | None | None | **Risk:** If Supabase not configured, redirects all non-public/auth routes to login |
| **4** | `publicRoutes` array | Pages | `publicRoutes.includes(path)` AND `!user` | Anonymous | **Allow** | N/A | `getUser()` | None | Public routes accessible without auth |
| **5** | `authRoutes` array | Pages | `authRoutes.includes(path)` AND `!user` | Anonymous | **Allow** | N/A | `getUser()` | None | Auth routes (login, signup) accessible without auth |
| **6** | `/onboarding/select-account-type` | Pages | `path === onboardingPath` AND `!user` | Anonymous | **Allow** | N/A | `getUser()` | None | Onboarding accessible without auth |
| **7** | Any path (not public/auth/onboarding) | Pages | `!user` (not authenticated) | Anonymous | **Redirect** | `/login?returnUrl={path}` | `getUser()` | None | **Risk:** Could create loop if login page requires auth (it doesn't) |
| **8** | Any path | Pages | `!profile` (user exists but no profile) AND `isSafeForProfileBootstrap` | Authenticated (no profile) | **Allow** | N/A | `getUser()`, `profiles` table | None | Allows profile creation on safe routes |
| **9** | Any path (not safe for bootstrap) | Pages | `!profile` (user exists but no profile) | Authenticated (no profile) | **Redirect** | `/login?returnUrl={path}` | `getUser()`, `profiles` table | None | Forces login if profile missing on protected routes |
| **10** | Any path (except `/suspended`) | Pages | `profile.is_suspended === true` | Suspended users | **Redirect** | `/suspended` | `getUser()`, `profiles.is_suspended` | None | Suspended users can only access `/suspended` |
| **11** | Any path (except `/talent/dashboard` and public routes) | Pages | `needsOnboarding` AND `profile.role === "talent"` AND `account_type === "unassigned"` | Talent (unassigned) | **Redirect** | `/talent/dashboard` | `getUser()`, `profiles.role`, `profiles.account_type` | None | Syncs account_type on next page load |
| **12** | Any path (except `/client/dashboard` and public routes) | Pages | `needsOnboarding` AND `profile.role === "client"` AND `account_type === "unassigned"` | Client (unassigned) | **Redirect** | `/client/dashboard` | `getUser()`, `profiles.role`, `profiles.account_type` | None | Syncs account_type on next page load |
| **13** | Any path (except onboarding, `/choose-role`, `/talent/dashboard`, public routes) | Pages | `needsOnboarding` AND `!profile.role` | Authenticated (no role) | **Redirect** | `/talent/dashboard` | `getUser()`, `profiles.role` | None | Defaults to talent dashboard |
| **14** | `/onboarding/select-account-type` | Pages | `!needsOnboarding` AND `path === onboardingPath` AND `!isAdmin` | Authenticated (onboarded) | **Redirect** | `determineDestination(profile)` | `getUser()`, `profiles.role`, `profiles.account_type` | None | Prevents accessing onboarding after completion |
| **15** | `authRoutes` array | Pages | `onAuthRoute` AND `user` exists | Authenticated | **Conditional** | See below | `getUser()` | None | Authenticated users redirected from auth pages |
| **15a** | `authRoutes` array | Pages | `onAuthRoute` AND `user` AND `signedOut === "true"` AND `path === "/login" \|\| "/choose-role"` | Authenticated (signing out) | **Allow** | N/A | `getUser()`, query param `signedOut` | None | Prevents redirect loop during signout |
| **15b** | `authRoutes` array | Pages | `onAuthRoute` AND `user` AND `returnUrl` exists AND `!needsOnboarding` AND `!isAdmin` | Authenticated | **Conditional Redirect** | `returnUrl` (if safe and accessible) | `getUser()`, query param `returnUrl` | None | Honors returnUrl if user has access |
| **15c** | `authRoutes` array | Pages | `onAuthRoute` AND `user` (no returnUrl or can't access) | Authenticated | **Redirect** | `determineDestination(profile)` | `getUser()`, `profiles.role`, `profiles.account_type` | None | Default redirect from auth pages |
| **16** | `/` (root) | Pages | `path === "/"` AND `!needsOnboarding` | Authenticated | **Redirect** | `determineDestination(profile)` | `getUser()`, `profiles.role`, `profiles.account_type` | None | Root path redirects to dashboard |
| **17** | `/admin/*` | Pages | `needsAdminAccess(path)` AND `!isAdmin` | Non-admin | **Conditional Redirect** | See below | `getUser()`, `profiles.role` | None | Admin-only routes |
| **17a** | `/admin/*` | Pages | `needsAdminAccess(path)` AND `!isAdmin` AND `destination !== path` | Non-admin | **Redirect** | `determineDestination(profile)` | `getUser()`, `profiles.role` | None | Redirects to user's dashboard |
| **17b** | `/admin/*` | Pages | `needsAdminAccess(path)` AND `!isAdmin` AND `destination === path` | Non-admin (already on destination) | **Redirect** | `/login?returnUrl={path}` | `getUser()`, `profiles.role` | None | **Risk:** Prevents infinite loop but forces re-auth |
| **18** | `/client/*` (except public client routes) | Pages | `needsClientAccess(path)` AND `!hasClientAccess(profile)` | Non-client | **Conditional Redirect** | See below | `getUser()`, `profiles.role`, `profiles.account_type` | None | Client-only routes |
| **18a** | `/client/*` | Pages | `needsClientAccess(path)` AND `!hasClientAccess(profile)` AND `destination !== path` | Non-client | **Redirect** | `determineDestination(profile)` | `getUser()`, `profiles.role`, `profiles.account_type` | None | Redirects to user's dashboard |
| **18b** | `/client/*` | Pages | `needsClientAccess(path)` AND `!hasClientAccess(profile)` AND `destination === path` | Non-client (already on destination) | **Redirect** | `/login?returnUrl={path}` | `getUser()`, `profiles.role`, `profiles.account_type` | None | **Risk:** Prevents infinite loop but forces re-auth |
| **19** | `/talent/*` (except `/talent`) | Pages | `needsTalentAccess(path)` AND `!hasTalentAccess(profile)` | Non-talent | **Conditional Redirect** | See below | `getUser()`, `profiles.role`, `profiles.account_type` | None | Talent-only routes |
| **19a** | `/talent/*` | Pages | `needsTalentAccess(path)` AND `!hasTalentAccess(profile)` AND `destination !== path` | Non-talent | **Redirect** | `determineDestination(profile)` | `getUser()`, `profiles.role`, `profiles.account_type` | None | Redirects to user's dashboard |
| **19b** | `/talent/*` | Pages | `needsTalentAccess(path)` AND `!hasTalentAccess(profile)` AND `destination === path` | Non-talent (already on destination) | **Redirect** | `/login?returnUrl={path}` | `getUser()`, `profiles.role`, `profiles.account_type` | None | **Risk:** Prevents infinite loop but forces re-auth |
| **20** | Any path (not matched above) | Pages | All other conditions pass | Authenticated | **Allow** | N/A | `getUser()`, `profiles` table | None | Default allow for authenticated users |

### Helper Functions Reference

**`isAssetOrApi(path)`** (Line 33-38)
- Returns `true` for: `/_next/*`, `/favicon.ico`, `/images/*`, `/api/*`, paths containing `.`
- **Early exit** - no auth check

**`publicRoutes`** (Lines 13-23)
```typescript
["/", "/about", "/gigs", "/talent", "/suspended", 
 "/client/signup", "/client/apply", "/client/apply/success", 
 "/client/application-status"]
```

**`authRoutes`** (Lines 24-30)
```typescript
["/login", "/reset-password", "/update-password", 
 "/verification-pending", "/choose-role"]
```

**`needsClientAccess(path)`** (Lines 74-79)
- Returns `true` for: `/client/*` EXCEPT `/client/apply`, `/client/apply/success`, `/client/application-status`, `/client/signup`

**`needsTalentAccess(path)`** (Line 80)
- Returns `true` for: `/talent/*` EXCEPT `/talent` (root)

**`needsAdminAccess(path)`** (Line 81)
- Returns `true` for: `/admin/*`

**`hasClientAccess(profile)`** (Lines 54-59)
- Returns `true` if: `profile.account_type === "client"` OR `profile.role === "client"`

**`hasTalentAccess(profile)`** (Lines 49-52)
- Returns `true` if: `profile.account_type === "talent"` OR `profile.role === "talent"`

**`determineDestination(profile)`** (Lines 63-72)
- Returns `/admin/dashboard` if `role === "admin"`
- Returns `/client/dashboard` if `account_type === "client"` OR `role === "client"`
- Returns `/talent/dashboard` if `account_type === "talent"` OR `role === "talent"`
- **Default:** `/talent/dashboard` (MVP: all signups are talent)

**`isSafeForProfileBootstrap`** (Lines 148-152)
- Returns `true` for: `authRoutes`, `publicRoutes`, `onboardingPath`, `/talent/dashboard`

---

## Additional Route Protection Logic

### Server Actions

#### `handleLoginRedirect(returnUrl?: string)` 
**File:** `lib/actions/auth-actions.ts` (Lines 520-769)

**Duplicates Middleware Logic:**
- ✅ Uses same `needsClientAccess()` and `needsTalentAccess()` helpers (Lines 507-514)
- ✅ Uses same `isSafeReturnUrl()` helper (Lines 499-504)
- ✅ Similar `determineDestination()` logic (Lines 558-730)

**Differences:**
- Creates profile if missing (calls `ensureProfileExists()`)
- Creates `talent_profiles` if missing for talent users
- Syncs `account_type` with `role` synchronously before redirect
- Uses `redirect()` (Next.js server action) instead of `NextResponse.redirect()`

**When Called:**
- After login form submission (server action)
- After email verification callback (indirectly via redirect)

**Risk:** Logic duplication - changes to middleware routing must be mirrored here

---

### Client-Side Route Protection

#### Auth Provider Redirects
**File:** `components/auth/auth-provider.tsx` (Lines 252-276, 280-335)

**SIGNED_IN Event Redirects:**
- If user signs in and NOT on allowed pages → redirects based on role:
  - `role === "talent"` → `/talent/dashboard`
  - `role === "client"` → `/client/dashboard`
  - `role === "admin"` → `/admin/dashboard`
  - No role → `/choose-role`

**Allowed Pages** (Line 261):
```typescript
["/settings", "/profile", "/onboarding", "/choose-role", "/verification-pending"]
```

**SIGNED_OUT Event Redirects:**
- Uses hardcoded `publicRoutes` array (Lines 299-309) - **DUPLICATE** of middleware
- Uses hardcoded `publicRoutePrefixes` array (Line 310): `["/talent/", "/gigs/"]`
- Uses hardcoded `authRoutes` array (Line 311) - **DUPLICATE** of middleware
- Redirects to `/login` if not on public/auth route

**Risk:** Public routes array duplicated in 3 places (middleware, auth-provider SIGNED_OUT, auth-provider SIGNED_IN allowed pages)

---

#### RequireAuth Component
**File:** `components/auth/require-auth.tsx` (Lines 18-52)

**Behavior:**
- Client-side component wrapper
- Checks `user` from `useAuth()` hook
- Redirects to `/choose-role` (default) or custom `redirectTo` prop
- Preserves `returnUrl` query parameter

**When Used:**
- Wraps components that need authentication
- **Note:** Middleware already protects routes, so this is redundant for most cases

**Risk:** Double protection - middleware + component (could cause conflicts)

---

### Server Component Redirects

#### Dashboard Page
**File:** `app/dashboard/page.tsx` (Lines 7-26)

**Behavior:**
- Server component that fetches profile
- If error or no profile → `redirect("/login")`
- Renders `DashboardClient` with `userRole` prop

**Risk:** This page may not be used (redirects handled by middleware)

---

#### Auth Callback Page
**File:** `app/auth/callback/page.tsx` (Lines 17-322)

**Behavior:**
- Handles email verification callback
- Exchanges code for session
- Creates/updates profile
- Redirects to dashboard with `?verified=true`:
  - Admin → `/admin/dashboard?verified=true`
  - Client → `/client/dashboard?verified=true`
  - Talent → `/talent/dashboard?verified=true`
- Preserves `returnUrl` if provided

**Redirect Format:**
```typescript
`/${role}/dashboard?verified=true&returnUrl=${encodeURIComponent(returnUrl)}`
```

**Risk:** None - this is the correct entry point for email verification

---

### API Route Protection

**Example:** `app/api/admin/update-user-role/route.ts` (Lines 18-36)

**Pattern:**
1. Get user via `createSupabaseServer()` → `getUser()`
2. If no user → return `401 Unauthorized`
3. Fetch profile to check role
4. If not admin → return `403 Forbidden`

**Note:** API routes bypass middleware (line 37) but can implement own auth checks.

---

## Redirect Loop Audit

### Potential Loop #1: Admin Access Denied Loop

**Scenario:**
1. Non-admin user tries to access `/admin/dashboard`
2. Middleware Rule 17a: Redirects to `determineDestination(profile)` → `/talent/dashboard`
3. If user somehow ends up back on `/admin/dashboard`:
4. Middleware Rule 17b: Redirects to `/login?returnUrl=/admin/dashboard`
5. After login, middleware Rule 15c: Redirects to `determineDestination(profile)` → `/talent/dashboard`
6. **Loop Broken:** User lands on talent dashboard

**Break Condition:** `destination !== path` check prevents infinite loop (Line 232)

**Risk Level:** 🟢 **Low** - Loop prevention logic exists

---

### Potential Loop #2: Client Access Denied Loop

**Scenario:**
1. Talent user tries to access `/client/dashboard`
2. Middleware Rule 18a: Redirects to `determineDestination(profile)` → `/talent/dashboard`
3. If user somehow ends up back on `/client/dashboard`:
4. Middleware Rule 18b: Redirects to `/login?returnUrl=/client/dashboard`
5. After login, middleware Rule 15c: Redirects to `determineDestination(profile)` → `/talent/dashboard`
6. **Loop Broken:** User lands on talent dashboard

**Break Condition:** `destination !== path` check prevents infinite loop (Line 244)

**Risk Level:** 🟢 **Low** - Loop prevention logic exists

---

### Potential Loop #3: Talent Access Denied Loop

**Scenario:**
1. Client user tries to access `/talent/dashboard`
2. Middleware Rule 19a: Redirects to `determineDestination(profile)` → `/client/dashboard`
3. If user somehow ends up back on `/talent/dashboard`:
4. Middleware Rule 19b: Redirects to `/login?returnUrl=/talent/dashboard`
5. After login, middleware Rule 15c: Redirects to `determineDestination(profile)` → `/client/dashboard`
6. **Loop Broken:** User lands on client dashboard

**Break Condition:** `destination !== path` check prevents infinite loop (Line 258)

**Risk Level:** 🟢 **Low** - Loop prevention logic exists

---

### Potential Loop #4: Onboarding Loop

**Scenario:**
1. User with `account_type === "unassigned"` and `role === "talent"` tries to access `/onboarding/select-account-type`
2. Middleware Rule 11: Redirects to `/talent/dashboard` (if not already there)
3. If user navigates back to `/onboarding/select-account-type`:
4. Middleware Rule 14: Redirects to `determineDestination(profile)` → `/talent/dashboard`
5. **Loop Broken:** User keeps landing on talent dashboard

**Break Condition:** Rule 14 prevents accessing onboarding after role is set

**Risk Level:** 🟢 **Low** - Logic prevents loop

---

### Potential Loop #5: Signout Loop

**Scenario:**
1. User signs out while on `/talent/dashboard`
2. Auth Provider SIGNED_OUT event (Line 280): Checks if on public/auth route
3. `/talent/dashboard` is NOT public → Redirects to `/login`
4. Middleware Rule 7: User not authenticated → Allows `/login` (auth route)
5. **Loop Broken:** User lands on login page

**Break Condition:** `signedOut === "true"` query param allows access to login/choose-role (Rule 15a)

**Risk Level:** 🟢 **Low** - Signout handling prevents loop

---

### Potential Loop #6: ReturnUrl Loop

**Scenario:**
1. User tries to access `/admin/dashboard` (not admin)
2. Middleware Rule 17b: Redirects to `/login?returnUrl=/admin/dashboard`
3. User logs in
4. Middleware Rule 15b: Checks `returnUrl` → User doesn't have admin access
5. Middleware Rule 15c: Redirects to `determineDestination(profile)` → `/talent/dashboard`
6. **Loop Broken:** User lands on talent dashboard (not admin)

**Break Condition:** Rule 15b checks access before honoring returnUrl (Lines 211-217)

**Risk Level:** 🟢 **Low** - Access check prevents loop

---

## Auth Boundary Map

### Public Routes (No Auth Required)

**Exact Matches:**
- `/` - Home page
- `/about` - About page
- `/gigs` - Public gigs listing
- `/talent` - Public talent directory root
- `/suspended` - Suspended user page
- `/client/signup` - Client signup
- `/client/apply` - Client application form
- `/client/apply/success` - Application success page
- `/client/application-status` - Application status check

**Prefix Matches:**
- `/talent/*` - Public talent profile pages (e.g., `/talent/john-doe`)
- `/gigs/*` - Public gig detail pages (e.g., `/gigs/123`)

**Note:** `/talent` (root) is public, but `/talent/*` (sub-routes) require talent access EXCEPT `/talent/[slug]` which is public.

---

### Auth-Only Routes (Require Authentication, Any Role)

**Auth Routes (Accessible When Logged Out):**
- `/login` - Login page
- `/reset-password` - Password reset
- `/update-password` - Password update
- `/verification-pending` - Email verification pending
- `/choose-role` - Role selection

**Protected Routes (Redirect to Login If Not Authenticated):**
- `/settings` - User settings
- `/profile` - User profile
- `/onboarding` - Onboarding flow
- `/dashboard` - Generic dashboard (redirects based on role)

---

### Role-Protected Route Prefixes

**Admin-Only:**
- `/admin/*` - All admin routes require `role === "admin"`

**Client-Only:**
- `/client/*` EXCEPT:
  - `/client/signup` (public)
  - `/client/apply` (public)
  - `/client/apply/success` (public)
  - `/client/application-status` (public)

**Talent-Only:**
- `/talent/*` EXCEPT:
  - `/talent` (root - public)
  - `/talent/[slug]` (public talent profiles)

---

### Special-Case Routes

**`/auth/callback`** - Email verification callback
- Bypasses normal auth flow
- Exchanges verification code for session
- Redirects to dashboard with `?verified=true`

**`/suspended`** - Suspended user page
- Accessible to suspended users
- All other routes redirect here if `is_suspended === true`

**`/onboarding/select-account-type`** - Onboarding
- Accessible when `account_type === "unassigned"`
- Redirects to dashboard after completion

**`/verification-pending`** - Email verification pending
- Accessible without auth (auth route)
- Shows resend verification email UI

**`/choose-role`** - Role selection
- Accessible without auth (auth route)
- Used for new user onboarding

---

## Duplication & Consolidation Recommendations

### 🔴 Critical Duplications

1. **Public Routes Array** - Defined in 3 places:
   - `middleware.ts` (Lines 13-23)
   - `components/auth/auth-provider.tsx` SIGNED_OUT handler (Lines 299-309)
   - `components/auth/auth-provider.tsx` SIGNED_IN allowed pages (Line 261) - different but related

   **Recommendation:** Extract to `lib/constants/routes.ts`:
   ```typescript
   export const PUBLIC_ROUTES = [...];
   export const AUTH_ROUTES = [...];
   export const PUBLIC_ROUTE_PREFIXES = ["/talent/", "/gigs/"];
   ```

2. **Access Check Helpers** - Defined in 2 places:
   - `middleware.ts` (Lines 49-59, 74-81)
   - `lib/actions/auth-actions.ts` (Lines 507-514)

   **Recommendation:** Extract to `lib/utils/route-access.ts`:
   ```typescript
   export function needsClientAccess(path: string): boolean;
   export function needsTalentAccess(path: string): boolean;
   export function needsAdminAccess(path: string): boolean;
   export function hasClientAccess(profile: ProfileRow | null): boolean;
   export function hasTalentAccess(profile: ProfileRow | null): boolean;
   ```

3. **Destination Determination** - Logic duplicated:
   - `middleware.ts` (Lines 63-72)
   - `lib/actions/auth-actions.ts` (Lines 558-730) - more complex version

   **Recommendation:** Extract to `lib/utils/route-destination.ts`:
   ```typescript
   export function determineDestination(profile: ProfileRow | null): string;
   ```

4. **ReturnUrl Validation** - Defined in 2 places:
   - `middleware.ts` (Lines 40-45) as `safeReturnUrl()`
   - `lib/actions/auth-actions.ts` (Lines 499-504) as `isSafeReturnUrl()`

   **Recommendation:** Extract to `lib/utils/return-url.ts`:
   ```typescript
   export function safeReturnUrl(value: string | null): string | null;
   ```

### 🟡 Minor Duplications

1. **Auth Provider Redirect Logic** - Similar to middleware but client-side
   - **Recommendation:** Keep separate (different execution context) but document the relationship

2. **RequireAuth Component** - Redundant with middleware
   - **Recommendation:** Consider removing or documenting when to use (only for client components that need immediate redirect)

---

## Summary

### Key Findings

1. ✅ **Middleware is comprehensive** - Handles most routing logic
2. ⚠️ **Duplication exists** - Public routes, access helpers, destination logic duplicated
3. ✅ **Loop prevention** - All potential loops have break conditions
4. ⚠️ **API routes bypass middleware** - Each API route must implement own auth
5. ✅ **Role-based access control** - Clear separation of admin/client/talent routes

### Priority Consolidations

1. **HIGH:** Extract public routes to constants file
2. **HIGH:** Extract access check helpers to shared utils
3. **MEDIUM:** Extract destination determination to shared utils
4. **MEDIUM:** Extract returnUrl validation to shared utils
5. **LOW:** Document when to use RequireAuth vs middleware

---

## Related Documentation

### Active Documentation
- **`AUTH_STRATEGY.md`** - Authentication architecture, database schema, signup flows, and trigger functions
- **`AUTH_QUERY_PATTERN_FIX_NOV_2025.md`** - Query pattern fixes (`.maybeSingle()` usage) used throughout routing code
- **`SIGN_OUT_IMPROVEMENTS.md`** - Sign out functionality and redirect handling

### Archived Documentation
- **`archive/AUTH_REDIRECT_FIX_NOV_2025.md`** - Historical redirect bug fixes and implementation details (superseded by this routing rules doc)
- **`archive/CAREER_BUILDER_LOGIN_SIGNUP_ANALYSIS.md`** - Career Builder signup flow analysis (historical reference)

**Note:** Archived docs are preserved for historical context but are superseded by this comprehensive routing rules reference.

---

**End of Report**
