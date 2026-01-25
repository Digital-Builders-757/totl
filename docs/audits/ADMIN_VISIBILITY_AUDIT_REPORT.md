# Admin Visibility Audit Report

**Date:** December 22, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Diagnose why admin dashboard cannot view "Talent Profile" or "Client Profile" pages and propose fixes.

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiables (middleware security only, RLS final authority, no service role in client)
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation spine
- ✅ `database_schema_audit.md` - Schema truth (RLS policies, table structures)
- ✅ `supabase/migrations/20250101000001_rls_policies.sql` - Admin RLS policies
- ✅ `supabase/migrations/20251220131212_drop_recursive_profiles_admin_policy.sql` - Recursive policy removal
- ✅ `docs/contracts/ADMIN_CONTRACT.md` - Admin capabilities expectations
- ✅ `docs/diagrams/role-surfaces.md` - Terminal boundaries

### Diagrams Used
- **`docs/diagrams/role-surfaces.md`** - Used to understand terminal boundaries (Admin terminal vs Talent/Client terminals)
- **`docs/diagrams/airport-model.md`** - Used to classify zones (Security, Terminal, Locks)

**Why these diagrams:**
- Role surfaces defines which routes belong to which terminal (admin viewing talent/client profiles crosses terminal boundaries)
- Airport model helps classify where fixes belong (middleware = Security, RLS = Locks, pages = Terminal)

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

1. **Middleware = security only**: Allow/deny/redirect only. No business logic. No DB writes.
   - **Impact:** Middleware must allow admin access to `/talent/[slug]` and `/client/profile` without redirecting, but current code redirects admins away from these routes.

2. **RLS is final authority**: Never bypass RLS with service role in client/browser code.
   - **Impact:** Admin queries must succeed under RLS policies. Current policies exist for `talent_profiles` and `client_profiles`, but `profiles` admin read policy was removed due to recursion.

3. **No DB calls in client components**: No writes and no privileged reads.
   - **Impact:** All admin profile viewing must happen in server components or server actions.

4. **No `select('*')`**: Always select explicit columns.
   - **Impact:** Admin queries must explicitly select columns (already followed in codebase).

5. **Missing profile is a valid bootstrap state**: Middleware must allow safe routes; changes must prevent redirect loops.
   - **Impact:** Admin viewing other users' profiles should not trigger profile bootstrap redirects.

**RED ZONE INVOLVED: YES**

**Red Zone Files:**
- ✅ `middleware.ts` - Route gating logic (Security zone)
- ✅ `app/talent/[slug]/page.tsx` - Talent profile page (Terminal zone)
- ✅ `app/client/profile/page.tsx` - Client profile page (Terminal zone)
- ✅ `supabase/migrations/**` - RLS policies (Locks zone)

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones Touched

#### **Security (middleware.ts)**
- **Why:** Middleware currently redirects admins away from `/talent/[slug]` and `/client/profile` because `needsTalentAccess()` and `needsClientAccess()` return `true` for these paths.
- **Responsibility:** Gate by session/role/suspension only. Must allow admin access to view-only profile pages.
- **Must NOT:** Create profiles, mutate data, or perform business logic.

#### **Terminal (UI pages)**
- **Why:** `/talent/[slug]/page.tsx` and `/client/profile/page.tsx` are the target routes admin needs to access.
- **Responsibility:** Render profile data fetched from server components. Handle null profiles gracefully.
- **Must NOT:** Perform DB writes or bypass RLS.

#### **Locks (RLS policies)**
- **Why:** Admin must be able to read `profiles`, `talent_profiles`, and `client_profiles` for any user.
- **Responsibility:** Enforce admin read access via non-recursive policies.
- **Must NOT:** Create recursive policies (like the dropped `profiles` admin policy).

#### **Staff (Server Actions / API Routes)**
- **Why:** Not directly involved, but admin profile viewing queries happen in server components.
- **Responsibility:** N/A (viewing is read-only, handled in RSC).

### Zones NOT Touched
- **Ticketing (Stripe)** - No billing impact
- **Announcements (Email)** - No notification changes
- **Baggage (Storage)** - No file upload changes
- **Control Tower (Admin tools)** - Admin dashboard itself works; issue is viewing individual profiles

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: Middleware Exception + Page Guard Updates (RECOMMENDED)

**High-level description:**
- Add middleware exception for admin viewing profile pages (`/talent/[slug]` and `/client/profile?userId=...`)
- Update `/client/profile/page.tsx` to accept `userId` query param and allow admin override
- Keep existing RLS policies (they already allow admin reads for `talent_profiles` and `client_profiles`)

**Files expected to change:**
1. `middleware.ts` - Add exception for admin accessing `/talent/[slug]` and `/client/profile` (view-only)
2. `app/client/profile/page.tsx` - Accept `userId` query param, allow admin to view any client profile
3. `app/admin/users/admin-users-client.tsx` - Fix client profile link to include `userId` param
4. `app/talent/[slug]/page.tsx` - No changes needed (already public, admin can access if middleware allows)

**Data model impact:** None

**Key risks:**
- **Redirect loops:** Low - Admin exception is narrow (only view routes, not edit routes)
- **Profile bootstrap gaps:** Low - Admin has profile, viewing others doesn't trigger bootstrap
- **RLS enforcement:** Low - Existing policies already allow admin reads
- **Stripe/webhook idempotency:** N/A - Read-only operation

**Why this respects Constitution:**
- Middleware stays security-only (allow/deny, no business logic)
- RLS remains final authority (policies already exist)
- No service role in client (all queries via server components)
- Explicit selects maintained (no changes to query patterns)

**Why this respects Airport boundaries:**
- Security zone: Minimal change (exception for admin view access)
- Terminal zone: Page guards updated to handle admin context
- Locks zone: No changes (policies already correct)

---

### Approach B: Admin-Only Profile View Routes

**High-level description:**
- Create new admin-only routes: `/admin/users/[userId]/talent-profile` and `/admin/users/[userId]/client-profile`
- These routes bypass middleware talent/client access checks (admin-only)
- Reuse existing profile page components but wrap in admin context

**Files expected to change:**
1. `app/admin/users/[userId]/talent-profile/page.tsx` - New admin-only talent profile viewer
2. `app/admin/users/[userId]/client-profile/page.tsx` - New admin-only client profile viewer
3. `app/admin/users/admin-users-client.tsx` - Update links to new admin routes
4. `middleware.ts` - No changes (admin routes already protected by `needsAdminAccess()`)

**Data model impact:** None

**Key risks:**
- **Redirect loops:** Low - Admin routes are separate, no cross-terminal conflicts
- **Profile bootstrap gaps:** Low - Admin has profile
- **RLS enforcement:** Low - Same policies apply
- **Code duplication:** Medium - Duplicates profile rendering logic

**Why this respects Constitution:**
- Middleware unchanged (admin routes already gated)
- RLS unchanged (same policies)
- No service role in client

**Why this respects Airport boundaries:**
- Security zone: No changes (admin routes already protected)
- Terminal zone: New admin-only pages (cleaner separation)
- Locks zone: No changes

**Drawback:** Code duplication (profile rendering logic exists in `/talent/[slug]` and `/client/profile`)

---

### Approach C: Service Role Admin Client (REJECTED)

**High-level description:**
- Use `createSupabaseAdminClient()` in admin profile pages to bypass RLS
- This violates Constitution: "RLS is final authority: never bypass RLS with service role in client/browser code"

**Why rejected:**
- ❌ Violates Constitution non-negotiable #6
- ❌ Service role should only be used for admin operations (create/delete users), not viewing
- ❌ Weakens security model (bypasses RLS audit trail)

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- ✅ Admin can click "View Talent Profile" from `/admin/users` → navigates to `/talent/[slug]` → sees full talent profile (including phone if RLS allows)
- ✅ Admin can click "View Career Builder Profile" from `/admin/users` → navigates to `/client/profile?userId=[targetUserId]` → sees full client profile
- ✅ Admin viewing profile pages shows "Admin viewing as staff" indicator (optional UX enhancement)
- ✅ Non-admin users cannot access admin profile views (middleware/RLS still enforces)

### Data Correctness
- ✅ Admin queries return all profile fields (email, contact info, profile fields) for target user
- ✅ RLS policies allow admin reads without recursion errors
- ✅ Null profiles handled gracefully (maybeSingle() pattern)

### Permissions & Access Control
- ✅ Admin can view any user's profile (talent or client)
- ✅ Admin cannot edit profiles via these view routes (edit remains in `/settings` or admin-specific edit pages)
- ✅ Non-admin users redirected away from admin profile views

### Failure Cases (What Must NOT Happen)
- ❌ Admin redirected to `/admin/dashboard` when clicking profile links (current bug)
- ❌ Recursive RLS policy errors (42P17)
- ❌ Admin queries return empty/null when profile exists
- ❌ Redirect loops (admin → profile → admin → profile)
- ❌ Service role used in client components

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path: Admin Views Talent Profile
1. Login as admin → navigate to `/admin/users`
2. Find a talent user in the list
3. Click "View Talent Profile" dropdown option
4. **Expected:** Navigate to `/talent/[slug]` (or `/talent/[userId]` if no slug)
5. **Expected:** See full talent profile (name, location, experience, specialties, languages)
6. **Expected:** See phone number (admin override in page logic)
7. **Expected:** No redirect to `/admin/dashboard`

#### Happy Path: Admin Views Client Profile
1. Login as admin → navigate to `/admin/users`
2. Find a client user in the list
3. Click "View Career Builder Profile" dropdown option
4. **Expected:** Navigate to `/client/profile?userId=[targetUserId]`
5. **Expected:** See full client profile (company name, industry, contact info)
6. **Expected:** No redirect to `/dashboard` or `/admin/dashboard`

#### Edge Case: Talent Profile Missing Slug
1. Admin clicks "View Talent Profile" for talent user with no `talent_profiles` row
2. **Expected:** Navigate to `/talent/[userId]` (UUID fallback)
3. **Expected:** Page handles missing profile gracefully (maybeSingle() pattern)

#### Edge Case: Client Profile Missing
1. Admin clicks "View Career Builder Profile" for client user with no `client_profiles` row
2. **Expected:** Page shows "Profile not found" or empty state (not error)

#### Security: Non-Admin Access
1. Login as talent user → manually navigate to `/client/profile?userId=[someUserId]`
2. **Expected:** Redirected to `/talent/dashboard` (middleware blocks)
3. Login as client user → manually navigate to `/talent/[slug]`
4. **Expected:** Can view (public route), but no admin-only fields shown

### Automated Tests to Add/Update

**File:** `tests/admin/admin-profile-visibility.spec.ts` (new)

```typescript
test('admin can view talent profile from users list', async ({ page }) => {
  // Login as admin
  // Navigate to /admin/users
  // Click "View Talent Profile" for first talent user
  // Assert: URL is /talent/[slug] or /talent/[userId]
  // Assert: Profile data visible (name, location, etc.)
  // Assert: No redirect to /admin/dashboard
});

test('admin can view client profile from users list', async ({ page }) => {
  // Login as admin
  // Navigate to /admin/users
  // Click "View Career Builder Profile" for first client user
  // Assert: URL is /client/profile?userId=[targetUserId]
  // Assert: Client profile data visible (company name, etc.)
  // Assert: No redirect
});

test('non-admin cannot access admin profile views', async ({ page }) => {
  // Login as talent user
  // Try to navigate to /client/profile?userId=[someUserId]
  // Assert: Redirected to /talent/dashboard
});
```

### RED ZONE Regression Checks

#### Middleware Redirect Loop Check
- ✅ Admin on `/admin/users` → click profile link → should NOT redirect back to `/admin/dashboard`
- ✅ Admin on `/talent/[slug]` → should NOT trigger redirect loop
- ✅ Admin on `/client/profile?userId=...` → should NOT trigger redirect loop

#### RLS Policy Check
- ✅ Run SQL: `SELECT * FROM profiles WHERE id = '[adminId]' AND role = 'admin'` → should return admin profile
- ✅ Run SQL as admin user (via Supabase client): `SELECT * FROM talent_profiles WHERE user_id = '[talentUserId]'` → should return talent profile
- ✅ Run SQL as admin user: `SELECT * FROM client_profiles WHERE user_id = '[clientUserId]'` → should return client profile
- ✅ Verify no recursive policy errors in Supabase logs

#### Profile Bootstrap Check
- ✅ Admin viewing profiles should NOT trigger `ensureProfileExists()` redirects
- ✅ Admin has profile → no bootstrap needed

---

## 1. Routes & Click Paths

### Admin Dashboard → Talent Profile
**Path:** `/admin/users` → Click "View Talent Profile" → `/talent/[slug]` or `/talent/[userId]`

**Evidence:**
```420:431:app/admin/users/admin-users-client.tsx
                                {userProfile.role === "talent" && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={userProfile.talent_profiles
                                        ? `/talent/${createNameSlug(userProfile.talent_profiles.first_name, userProfile.talent_profiles.last_name)}`
                                        : `/talent/${userProfile.id}`}
                                      className="text-gray-300 hover:bg-gray-700 flex items-center"
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Talent Profile
                                    </Link>
                                  </DropdownMenuItem>
                                )}
```

### Admin Dashboard → Client Profile
**Path:** `/admin/users` → Click "View Career Builder Profile" → `/client/profile` (MISSING `userId` param)

**Evidence:**
```433:443:app/admin/users/admin-users-client.tsx
                                {userProfile.role === "client" && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/client/profile`}
                                      className="text-gray-300 hover:bg-gray-700 flex items-center"
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Career Builder Profile
                                    </Link>
                                  </DropdownMenuItem>
                                )}
```

**Problem:** Link doesn't include `userId` query param, so admin sees their own profile (or gets redirected if they're not a client).

---

## 2. Where It Breaks (with evidence)

### Block #1: Middleware Redirects Admin Away from `/talent/[slug]`

**Location:** `middleware.ts` lines 170-182

**Evidence:**
```170:182:middleware.ts
  // Admins should not "fall into" Talent/Client terminals (often caused by hardcoded client redirects).
  // Keep this narrowly scoped: only routes that explicitly require non-admin access are redirected.
  if (isAdmin && (needsClientAccess(path) || needsTalentAccess(path))) {
    if (debugRouting) {
      console.info("[totl][middleware] redirect admin to admin dashboard", {
        from: path,
        to: PATHS.ADMIN_DASHBOARD,
        userId: user.id,
        role: profile.role ?? null,
        accountType: profile.account_type ?? null,
        reason: "admin_on_non_admin_terminal",
      });
    }
    return NextResponse.redirect(new URL(PATHS.ADMIN_DASHBOARD, req.url));
  }
```

**Root Cause:** `needsTalentAccess('/talent/[slug]')` returns `false` for public slug routes (line 58 in `route-access.ts`), BUT the check happens BEFORE the public route exception. Actually, wait—let me re-read...

**Re-reading `route-access.ts`:**
```37:72:lib/utils/route-access.ts
export function needsTalentAccess(path: string) {
  // Approach B + G1: /talent directory is disabled (not public, not talent-only)
  if (path === PATHS.TALENT_LANDING) return false;

  // Public: /talent/[slug] (public marketing profiles) should remain accessible while signed out.
  // Check if this is a public slug route (exactly one segment after /talent/)
  if (path.startsWith(PREFIXES.TALENT)) {
    const talentPath = path.slice(PREFIXES.TALENT.length);
    const segments = talentPath.split("/").filter(Boolean);
    
    // If exactly one segment and not a protected route, it's public (no talent access needed)
    if (segments.length === 1) {
      const slug = segments[0];
      const isTalentProtected =
        slug === "dashboard" ||
        slug === "profile" ||
        slug.startsWith("settings") ||
        slug.startsWith("subscribe") ||
        slug === "signup";
      
      if (!isTalentProtected) {
        return false; // Public marketing profile
      }
    }
  }

  // Private: dashboard + profile editor + settings + subscribe flow.
  const privateTalentPrefixes = [
    PATHS.TALENT_DASHBOARD,
    PATHS.TALENT_PROFILE,
    PREFIXES.TALENT_SETTINGS,
    PATHS.TALENT_SUBSCRIBE,
  ] as const;

  return privateTalentPrefixes.some((p) => path === p || path.startsWith(`${p}/`));
}
```

**Analysis:** `needsTalentAccess('/talent/john-doe')` returns `false` (public route), so middleware should NOT redirect admin. But wait—the middleware check is `if (isAdmin && (needsClientAccess(path) || needsTalentAccess(path)))`. If `needsTalentAccess` returns `false`, the condition is false, so no redirect.

**Re-checking:** Actually, `/talent/[slug]` should work for admin because `needsTalentAccess()` returns `false`. The issue might be elsewhere.

**Wait—checking `/client/profile`:**
```27:35:lib/utils/route-access.ts
export function needsClientAccess(path: string) {
  return (
    path.startsWith(PREFIXES.CLIENT) &&
    path !== PATHS.CLIENT_APPLY &&
    path !== PATHS.CLIENT_APPLY_SUCCESS &&
    path !== PATHS.CLIENT_APPLICATION_STATUS &&
    path !== PATHS.CLIENT_SIGNUP
  );
}
```

`/client/profile` starts with `/client/` and is not in the exception list, so `needsClientAccess('/client/profile')` returns `true`. Therefore, admin IS redirected away from `/client/profile`.

**Root Cause Classification:** ✅ **Middleware route gating** - Admin is redirected away from `/client/profile` because `needsClientAccess()` returns `true`.

---

### Block #2: Client Profile Page Redirects Non-Clients

**Location:** `app/client/profile/page.tsx` lines 34-36

**Evidence:**
```34:36:app/client/profile/page.tsx
  if (profile.role !== "client") {
    redirect("/dashboard");
  }
```

**Root Cause Classification:** ✅ **Server page auth guard** - Page explicitly redirects non-clients (including admins) to `/dashboard`.

**Additional Issue:** Page doesn't accept `userId` query param, so it always shows the current user's profile (or redirects if current user isn't a client).

---

### Block #3: Missing `userId` Param in Admin Link

**Location:** `app/admin/users/admin-users-client.tsx` line 436

**Evidence:**
```436:436:app/admin/users/admin-users-client.tsx
                                      href={`/client/profile`}
```

**Root Cause Classification:** ✅ **UI gate bug** - Link doesn't include target user ID, so admin can't view other users' client profiles.

---

### Block #4: RLS Policy for `profiles` Table Missing

**Location:** `supabase/migrations/20251220131212_drop_recursive_profiles_admin_policy.sql`

**Evidence:**
```18:18:supabase/migrations/20251220131212_drop_recursive_profiles_admin_policy.sql
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
```

**Root Cause Classification:** ⚠️ **RLS policy denial** - Admin read policy was removed due to recursion. However, this might not block profile viewing if admin queries use joins to `talent_profiles`/`client_profiles` (which have admin policies).

**Impact:** Admin cannot directly query `profiles` table for other users (but can via joins to `talent_profiles`/`client_profiles`).

---

## 3. Root Cause(s)

### Primary Root Causes (Ranked)

1. **Middleware route gating** (HIGH PRIORITY)
   - Admin redirected away from `/client/profile` because `needsClientAccess()` returns `true`
   - Fix: Add exception for admin viewing profile pages (view-only, not edit)

2. **Server page auth guard** (HIGH PRIORITY)
   - `/client/profile/page.tsx` redirects non-clients (including admins)
   - Fix: Allow admin override, accept `userId` query param

3. **UI gate bug** (MEDIUM PRIORITY)
   - Admin link to client profile missing `userId` param
   - Fix: Add `?userId=[targetUserId]` to link

4. **RLS policy missing** (LOW PRIORITY - might not block)
   - `profiles` table admin read policy removed due to recursion
   - Fix: Add non-recursive admin read policy OR rely on joins (which already work)

---

## 4. Fix Options (ranked: safest/minimal first)

### Option 1: Middleware Exception + Page Guard Updates (RECOMMENDED)

**Safety:** ✅ High - Minimal changes, narrow exception scope  
**Minimal:** ✅ Yes - Only 3 files changed  
**Security:** ✅ Maintained - Admin exception is view-only

**Changes:**
1. `middleware.ts` - Add admin exception for `/client/profile` (view-only)
2. `app/client/profile/page.tsx` - Accept `userId` param, allow admin override
3. `app/admin/users/admin-users-client.tsx` - Fix link to include `userId`

**RLS:** No changes needed (policies already allow admin reads via joins)

---

### Option 2: Admin-Only Profile Routes

**Safety:** ✅ High - No middleware changes  
**Minimal:** ❌ No - Requires new routes + component duplication  
**Security:** ✅ Maintained - Admin routes already protected

**Changes:**
1. Create `app/admin/users/[userId]/talent-profile/page.tsx`
2. Create `app/admin/users/[userId]/client-profile/page.tsx`
3. Update admin links to new routes

**RLS:** No changes needed

**Drawback:** Code duplication

---

### Option 3: Non-Recursive Admin RLS Policy

**Safety:** ⚠️ Medium - Must avoid recursion  
**Minimal:** ✅ Yes - Single migration  
**Security:** ✅ Maintained - Admin-only policy

**Changes:**
1. Add migration with non-recursive admin read policy for `profiles` table
2. Use `auth.jwt()` or separate admin check table to avoid recursion

**Drawback:** More complex RLS policy design

---

## 5. Recommended Patch Set (Approach A)

### Patch 1: Middleware Exception for Admin Profile Viewing

**File:** `middleware.ts`

**Change:** Add exception for admin accessing `/client/profile` when `userId` query param is present (view-only, not edit).

```typescript
// After line 169, before the admin redirect check:
// Allow admin to view profile pages (view-only, not edit)
if (isAdmin) {
  // Exception: Admin can view /client/profile if userId param is present (viewing other user)
  if (path === '/client/profile' && req.nextUrl.searchParams.has('userId')) {
    // Allow through - page will handle admin context
    return res;
  }
  // Exception: Admin can view /talent/[slug] (public route, but ensure no redirect)
  if (path.startsWith('/talent/') && !needsTalentAccess(path)) {
    // Public talent profile - allow admin through
    return res;
  }
}

// Then continue with existing redirect check (line 170)
if (isAdmin && (needsClientAccess(path) || needsTalentAccess(path))) {
  // ... existing redirect logic
}
```

**Risk:** Low - Exception is narrow (only view routes with `userId` param)

---

### Patch 2: Client Profile Page Admin Override

**File:** `app/client/profile/page.tsx`

**Change:** Accept `userId` query param, allow admin to view any client profile.

```typescript
export default async function ClientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get current user's profile to check admin role
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !currentProfile) {
    redirect("/login");
  }

  // Determine target user ID (admin viewing other user, or self)
  const targetUserId = userId || user.id;
  const isAdmin = currentProfile.role === "admin";
  const isViewingOtherUser = userId && userId !== user.id;

  // Allow admin to view any client profile, or allow client to view own profile
  if (!isAdmin && currentProfile.role !== "client") {
    redirect("/dashboard");
  }

  // If admin viewing other user, verify target is a client
  if (isAdmin && isViewingOtherUser) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .maybeSingle();
    
    if (targetProfile?.role !== "client") {
      redirect("/admin/users"); // Target is not a client
    }
  }

  // Fetch client profile for target user
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select(
      "id,user_id,company_name,industry,website,contact_name,contact_email,contact_phone,company_size,created_at,updated_at"
    )
    .eq("user_id", targetUserId)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin && isViewingOtherUser && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-blue-300 text-sm">
            Admin viewing as staff
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Complete Your Company Profile</h1>
          <p className="text-gray-300 mt-2">
            Add your company information to make your gigs more attractive to talent
          </p>
        </div>
        <ClientProfileForm initialData={clientProfile || undefined} />
      </div>
    </div>
  );
}
```

**Risk:** Low - Admin check is explicit, RLS still enforces

---

### Patch 3: Fix Admin Link to Include userId

**File:** `app/admin/users/admin-users-client.tsx`

**Change:** Add `userId` query param to client profile link.

```typescript
// Line 436, change:
href={`/client/profile`}

// To:
href={`/client/profile?userId=${userProfile.id}`}
```

**Risk:** None - Simple link fix

---

## 6. Verification Checklist

### What to Click

1. ✅ Login as admin → `/admin/users` → Click "View Talent Profile" for talent user
   - **Expected:** Navigate to `/talent/[slug]` or `/talent/[userId]`
   - **Expected:** See full talent profile
   - **Expected:** No redirect to `/admin/dashboard`

2. ✅ Login as admin → `/admin/users` → Click "View Career Builder Profile" for client user
   - **Expected:** Navigate to `/client/profile?userId=[targetUserId]`
   - **Expected:** See full client profile
   - **Expected:** See "Admin viewing as staff" banner
   - **Expected:** No redirect to `/dashboard` or `/admin/dashboard`

3. ✅ Login as talent user → Try to access `/client/profile?userId=[someUserId]`
   - **Expected:** Redirected to `/talent/dashboard` (middleware blocks)

### What Queries Should Succeed

**As admin user (via Supabase client):**
```sql
-- Should succeed (admin RLS policy exists)
SELECT * FROM talent_profiles WHERE user_id = '[talentUserId]';

-- Should succeed (admin RLS policy exists)
SELECT * FROM client_profiles WHERE user_id = '[clientUserId]';

-- Might fail if profiles admin policy missing (but joins work)
SELECT p.*, tp.* FROM profiles p
LEFT JOIN talent_profiles tp ON tp.user_id = p.id
WHERE p.id = '[talentUserId]';
```

**Expected:** Admin can read `talent_profiles` and `client_profiles` for any user (policies exist in `20250101000001_rls_policies.sql`).

---

## 7. Follow-up Risks / Regression Tests

### Risk: Redirect Loops
**Mitigation:** Admin exception is narrow (only `/client/profile` with `userId` param). Test admin navigating between admin dashboard and profile pages.

### Risk: RLS Policy Recursion
**Mitigation:** Do NOT add recursive `profiles` admin policy. Rely on existing `talent_profiles`/`client_profiles` admin policies (which work via joins).

### Risk: Admin Can Edit Profiles
**Mitigation:** Profile pages are view-only. Edit remains in `/settings` (self-edit) or admin-specific edit pages (if created).

### Risk: Non-Admin Access to Admin Views
**Mitigation:** Middleware still enforces `needsClientAccess()` for non-admins. Page guard checks admin role.

### Regression Tests
- ✅ Admin dashboard still works
- ✅ Talent dashboard still works (non-admin)
- ✅ Client dashboard still works (non-admin)
- ✅ Public `/talent/[slug]` still works (signed-out users)
- ✅ Profile edit in `/settings` still works (self-edit only)

---

## Summary

**Primary Issue:** Admin cannot view client profiles due to middleware redirect + page guard.

**Recommended Fix:** Approach A (Middleware Exception + Page Guard Updates) - Minimal changes, maintains security, fixes all blocks.

**Next Steps:** Implement Patch 1, 2, and 3, then verify with manual tests.

