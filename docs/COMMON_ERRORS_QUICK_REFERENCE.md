# 🚨 CRITICAL ERROR PREVENTION - MANDATORY CHECKS

**BEFORE PUSHING ANY CODE TO DEVELOP OR MAIN, YOU MUST:**

## **1. SCHEMA & TYPES VERIFICATION**
```bash
# ALWAYS run these commands before pushing
npm run schema:verify:comprehensive
npm run types:check
npm run build
```

## **2. IMPORT PATH VERIFICATION**
**❌ NEVER USE THESE INCORRECT PATHS:**
- `@/lib/supabase/supabase-admin-client` (WRONG - extra `/supabase/`)
- `@/types/database` (WRONG - should be `/types/supabase`)

**✅ ALWAYS USE THESE CORRECT PATHS:**
- `@/lib/supabase-admin-client` (CORRECT)
- `@/types/supabase` (CORRECT)

## **3. COMMON ERRORS TO AVOID**
- **Schema Sync Errors:** `types/database.ts is out of sync with remote schema`
  - **Fix:** Run `npm run types:regen` for correct environment
- **Import Path Errors:** `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'`
  - **Fix:** Use correct path `@/lib/supabase-admin-client`
- **Missing Import Errors:** `ReferenceError: createNameSlug is not defined`
  - **Fix:** Add `import { createNameSlug } from "@/lib/utils/slug";` at top of file
  - **Prevention:** When using utility functions, always verify import exists
  - **Check:** Run `grep -r "createNameSlug" <file>` and verify import line exists
- **Import Order Errors:** `import/order` warnings in linting
  - **Fix:** Run `npm run lint -- --fix` or manually reorder imports
- **Type Errors:** `Property 'role' does not exist on type 'never'`
  - **Fix:** Ensure Database type is imported from `@/types/supabase`
- **Stripe API Version Errors:** `Invalid Stripe API version format with unsupported '.clover' suffix`
  - **Fix:** Stripe API versions must be plain `YYYY-MM-DD` strings. Use the latest stable release without suffix (currently `apiVersion: '2024-06-20'`).
- **Stripe Property Access Errors:** `Property 'current_period_end' does not exist on type 'Subscription'`
  - **Fix:** Use subscription items: read `current_period_end` from `subscription.items.data[n]` and fall back to legacy property only if available.
- **Profile Type Mismatch Errors:** `Type 'Partial<Profile>' is missing required properties`
  - **Fix:** Select all columns with `select("*")` instead of specific columns when passing to components expecting full Profile type
- **Subscription Plan Detection Errors:** Silent fallback to `'monthly'` when `subscription.items` missing or price IDs not matched
  - **Fix:** Check every subscription item, fall back to `subscription.metadata.plan`, and if still unknown retain the existing `profiles.subscription_plan` value to avoid data loss.
- **Redirect Errors Intercepted in Client Components:** `redirect()` throws special error that gets swallowed by `try/catch`
  - **Fix:** Use `isRedirectError(error)` helper from `@/lib/is-redirect-error` and rethrow when true so Next.js can continue the redirect
- **Billing Portal Session URL Missing:** `redirect(undefined)` when session URL is absent
  - **Fix:** Verify `session.url` exists before redirect and throw a descriptive error if Stripe fails to return a URL.
- **Webhook Acknowledges Failure:** Stripe receives `{ received: true }` even when Supabase updates fail
  - **Fix:** Bubble up failures from `handleSubscriptionUpdate()` and return HTTP 500 so Stripe retries when the database update does not succeed.
- **Build Failures:** Any build that doesn't pass locally
  - **Fix:** Never push code that doesn't build locally
- **Schema Truth Failure (merging to `main`):** `types/database.ts is out of sync with remote schema (Environment: production)`
  - **Root Cause:** `types/database.ts` was regenerated from the dev project while `main` CI compares against the production Supabase project.
  - **Fix:** Before merging to `main`, set `SUPABASE_PROJECT_ID=<prod_project_ref>`, apply pending migrations to production (`npx supabase@2.34.3 db push --db-url ...`), then run `npm run types:regen:prod`. Commit the regenerated file only after prod schema matches.
  - **Prevention:** Never run `npm run types:regen` right before a production merge unless you are targeting the production project ref. Keep a checklist item for "regen types from prod + run schema truth" in every release PR.
- **.env Encoding Errors:** `unexpected character '»' in variable name` when running Supabase CLI
  - **Root Cause:** `.env.local` saved as UTF-8 **with BOM**; the hidden BOM bytes (`ï»¿`) confuse the CLI dotenv parser.
  - **Fix:** In VS Code choose “File → Save with Encoding → UTF-8” (no BOM) for `.env.local`. Before running CLI commands also set `SUPABASE_INTERNAL_NO_DOTENV=1` or temporarily rename `.env.local` to keep smart quotes/BOM characters from breaking the parser.
  - **Prevention:** Keep `.env.local` plain UTF-8, avoid smart quotes, and always pass through the `cmd /d /c "set SUPABASE_INTERNAL_NO_DOTENV=1 && …"` wrapper already baked into the npm scripts.

## **4. BRANCH-SPECIFIC REQUIREMENTS**
- **DEVELOP Branch:** Use `npm run types:regen:dev` if needed
- **MAIN Branch:** Use `npm run types:regen:prod` if needed
- **Both Branches:** Must pass `npm run build` before pushing

## **5. EMERGENCY FIXES**
If you encounter these errors:
```bash
# Schema sync error
npm run types:regen && npm run build

# Import path errors - find and fix manually
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# Build failures - fix locally first
npm run build
```

**🚨 CRITICAL RULE: NEVER PUSH CODE THAT DOESN'T BUILD LOCALLY!**

## **6. PRE-COMMIT CHECKLIST REFERENCE**

**ALWAYS run this checklist before pushing:**
1. ✅ `npm run schema:verify:comprehensive`
2. ✅ `npm run build`
3. ✅ `npm run lint`
4. ✅ Check import paths are correct
5. ✅ Verify branch-specific types are generated
6. ✅ Read `docs/PRE_PUSH_CHECKLIST.md` for detailed guidance

**If ANY step fails, DO NOT PUSH until it's fixed!**

---

# 🚨 COMMON ERRORS QUICK REFERENCE

## ⚡ EMERGENCY FIXES - COPY & PASTE COMMANDS

### **1. Schema Sync Error**
```bash
# Error: types/database.ts is out of sync with remote schema
npm run types:regen
npm run build
git add types/database.ts
git commit -m "Fix schema sync: regenerate types"
```

### **1b. Schema Truth Error on `main` (Production)**
```bash
# 1. Export your production project ref
set SUPABASE_PROJECT_ID=<prod_project_ref>   # PowerShell: $env:SUPABASE_PROJECT_ID="<prod>"
set SUPABASE_INTERNAL_NO_DOTENV=1            # prevent CLI from parsing .env.local

# 2. Apply migrations to production (required before regen)
npx -y supabase@2.34.3 db push --db-url "postgresql://postgres:<DB_PASSWORD>@db.<prod_project_ref>.supabase.co:5432/postgres"

# 3. Regenerate types from production
npm run types:regen:prod

# 4. Commit regenerated types
git add types/database.ts
git commit -m "Sync prod types"
```
### **2. Import Path Error**
```bash
# Error: Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'
# Find all incorrect imports
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# Fix manually: Replace with @/lib/supabase-admin-client
```

### **3. Database Type Error**
```bash
# Error: Cannot find module '@/types/database'
# Find all incorrect imports
grep -r "@/types/database" . --exclude-dir=node_modules

# Fix manually: Replace with @/types/supabase
```

### **4. Build Failure**
```bash
# Error: Build failed because of webpack errors
npm run build
# Fix all errors locally before pushing
```

### **5. Playwright MCP Connection Error**
```bash
# Error: Cannot find module './console' or "No server info found"
# 1. Install packages locally
npm install --save-dev playwright @playwright/test @playwright/mcp --legacy-peer-deps
npx playwright install --with-deps chromium

# 2. Update Cursor MCP config (c:\Users\young\.cursor\mcp.json)
# Add --no-install flag to args array

# 3. Verify command works
npx --no-install @playwright/mcp --help

# 4. Restart Cursor completely
```

**See:** `docs/MCP_QUICK_FIX.md` for detailed steps

### **6. Sentry 406 Not Acceptable Errors**
```bash
# Error: profiles?select=role&id=eq.xxx returned 406 Not Acceptable
# Root Cause: Using .single() when profile might not exist
# Fix: Replace .single() with .maybeSingle() in all profile queries

# Files to check:
# - lib/actions/auth-actions.ts
# - middleware.ts
# - components/auth/auth-provider.tsx

# Pattern to find:
grep -r "\.single()" lib/actions/auth-actions.ts middleware.ts components/auth/

# Replace with:
.single() → .maybeSingle()
```

### **7. Sentry Not Receiving Errors**
```bash
# Error: Errors not appearing in Sentry dashboard
# 1. Check diagnostic endpoint
curl http://localhost:3000/api/sentry-diagnostic

# 2. Verify DSN in .env.local matches project ID 4510191108292609
# 3. Check console for Sentry initialization logs
# 4. Test with: http://localhost:3000/api/test-sentry?type=error

# Common issues:
# - Wrong project ID in DSN (should end in 4510191108292609)
# - DSN not set in .env.local
# - Errors being filtered by beforeSend hooks
```

### **8. Build Error: Cannot find name 'talentProfile'**
```bash
# Error: Type error in middleware.ts - variable out of scope
# Fix: Ensure variables are defined in the same scope where used
# Pattern: Wrap case blocks in braces, check variable scope
```

### **9. ReferenceError: Function is not defined (Missing Import)**
```bash
# Error: ReferenceError: createNameSlug is not defined
# Root Cause: Using utility function without importing it
# Common in: Client components, server components, pages

# Quick check - find all uses of utility functions:
grep -r "createNameSlug\|getTalentSlug\|createSlug" app/ --include="*.tsx" --include="*.ts"

# Verify each file has the import:
# Required imports for common utilities:
# - createNameSlug: import { createNameSlug } from "@/lib/utils/slug";
# - getTalentSlug: import { getTalentSlug } from "@/lib/utils/talent-slug";
# - createSlug: import { createSlug } from "@/lib/utils/slug";

# Files that commonly use these:
# - app/admin/talent/admin-talent-client.tsx
# - app/admin/users/admin-users-client.tsx
# - app/client/applications/page.tsx
# - app/client/bookings/page.tsx
# - app/talent/talent-client.tsx
# - app/talent/[slug]/page.tsx

# Prevention checklist:
# 1. When using any function from lib/utils/, check if import exists
# 2. Always import at the top of the file
# 3. If refactoring, verify imports are added to new files
# 4. Run build locally to catch missing imports before push
```

### **10. N+1 Query Issue - Multiple Profile Queries**
```bash
# Error: Sentry shows "N+1 API Call" with 5+ duplicate profile queries
# Root Cause: Multiple components fetching same profile data separately
# Common in: Dashboard pages, profile components

# Quick check - find duplicate profile queries:
grep -r "from.*profiles.*select\|\.from\(.*profiles.*\)\.select" app/ --include="*.tsx"

# Verify components use auth provider profile:
# ✅ CORRECT - Use profile from auth context
const { user, profile } = useAuth();
// profile.avatar_url, profile.display_name, profile.role already available

# ❌ WRONG - Don't fetch profile separately in client components
const [userProfile, setUserProfile] = useState(null);
useEffect(() => {
  supabase.from("profiles").select("avatar_url, display_name")...
}, []);

# Files that should use auth provider profile:
# - app/talent/dashboard/page.tsx ✅ Fixed
# - app/client/dashboard/page.tsx ✅ Fixed
# - app/talent/[slug]/talent-profile-client.tsx ✅ Fixed
# - Any client component needing profile data

# Prevention checklist:
# 1. Always use profile from useAuth() hook in client components
# 2. Only query profiles separately in server components (routing)
# 3. Check Sentry for N+1 query warnings
# 4. Verify single profile query per page load in network tab
```

### **11. Foreign Key Relationship Error - Invalid Join**
```bash
# Error: PGRST200 - "Could not find a relationship between 'gigs' and 'client_profiles'"
# Error: "column 'first_name' does not exist on 'talent_id'"
# Root Cause: Attempting to join tables that don't have direct foreign key relationships
# Common in: Admin pages, application/booking queries

# ❌ WRONG - Invalid join (no direct FK between gigs and client_profiles)
.select(`
  *,
  client_profiles!inner(company_name)  # No FK between gigs.client_id → client_profiles
`)

# ❌ WRONG - Invalid join (talent_id is UUID in profiles, not talent_profiles)
.select(`
  *,
  talent_profiles:talent_id(first_name, last_name)  # talent_id references profiles.id, not talent_profiles
`)

# ✅ CORRECT - Fetch separately and combine
# Step 1: Fetch main data with valid joins
const { data: bookings } = await supabase
  .from("bookings")
  .select(`
    *,
    gigs!inner(id, title),
    profiles!talent_id(display_name)
  `)

# Step 2: Fetch related data separately
const bookingsWithTalent = await Promise.all(
  bookings.map(async (booking) => {
    const { data: talentProfile } = await supabase
      .from("talent_profiles")
      .select("first_name, last_name")
      .eq("user_id", booking.talent_id)  # Use user_id, not talent_id
      .maybeSingle();
    
    return {
      ...booking,
      talent_profiles: talentProfile || null,
    };
  })
);

# Common foreign key relationships (check database_schema_audit.md):
# - applications.talent_id → profiles.id (NOT talent_profiles)
# - applications.gig_id → gigs.id
# - bookings.talent_id → profiles.id (NOT talent_profiles)
# - bookings.gig_id → gigs.id
# - gigs.client_id → profiles.id (NOT client_profiles directly)
# - talent_profiles.user_id → profiles.id
# - client_profiles.user_id → profiles.id

# Prevention checklist:
# 1. Always check database_schema_audit.md for FK relationships
# 2. Never join tables without direct foreign keys
# 3. Use separate queries for indirect relationships (through profiles)
# 4. Verify join syntax matches actual FK structure
```

### **12. Import Order & Unused Import Warnings**
```bash
# Error: import/order warnings - imports not in correct order
# Error: '@typescript-eslint/no-unused-vars' - imports defined but never used
# Root Cause: Incorrect import order or leftover imports from refactoring

# ✅ CORRECT import order:
# 1. External packages (lucide-react, next/link, etc.)
# 2. React imports (useState, useEffect, etc.)
# 3. Internal imports (@/components, @/lib, etc.)
# 4. Type imports (import type ...)

import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";

# ❌ WRONG - next/link after react imports
import { useState } from "react";
import Link from "next/link";  # Should be before react

# Fix: Reorder imports or run npm run lint -- --fix
# Prevention: Remove unused imports when refactoring
```

### **13. Type Mismatch: undefined vs null**
```bash
# Error: Type '... | undefined' is not assignable to type '... | null'
# Root Cause: .find() returns undefined, but variable is typed as null
# Common in: Talent/profile lookup, array searches

# ❌ WRONG - .find() returns undefined, but talent is typed as null
let talent: TalentProfile | null = null;
talent = allTalent.find((t) => t.id === id) as TalentProfile | undefined;

# ✅ CORRECT - Convert undefined to null using ?? null
let talent: TalentProfile | null = null;
talent = allTalent.find((t) => t.id === id) ?? null;

# Or inline:
talent = allTalent.find((t) => {
  const talentSlug = createNameSlug(t.first_name, t.last_name);
  return talentSlug === slug;
}) ?? null;

# Pattern:
# - maybeSingle() → Type | null ✅
# - .find(...) → Type | undefined → normalize with ?? null
# - All variables use Type | null, never undefined

# Files fixed:
# - app/talent/[slug]/page.tsx ✅ Fixed
```

### **14. maybeSingle() Error Handling - PGRST116 Check**
```bash
# Error: Syntax error - "profileCheckError." with no property name
# Error: Logic error - checking for PGRST116 with maybeSingle()
# Root Cause: Incorrect error handling with .maybeSingle() - PGRST116 doesn't occur
# Common in: Profile queries, authentication flows

# ❌ WRONG - Syntax error and wrong logic
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", user.id)
  .maybeSingle();

// Syntax error - missing property name
if (!profile || (profileError && profileError. === "PGRST116")) {
  // Create profile
}

// ❌ WRONG - Checking for PGRST116 with maybeSingle() (doesn't occur)
if (profileError && profileError.code === "PGRST116") {
  // Create profile
}

# ✅ CORRECT - Handle errors, then check !profile
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", user.id)
  .maybeSingle();

// Handle actual errors first (not PGRST116 - that doesn't occur with maybeSingle())
if (profileError) {
  console.error("Error checking profile:", profileError);
  // Log to Sentry, return error, etc.
  return { error: "Failed to check existing profile" };
}

// If profile doesn't exist, create it
// With maybeSingle(), no rows returns null data (not an error), so check !profile
if (!profile) {
  // Create profile
}

# Key Pattern:
# - .maybeSingle() → Returns null data (not error) when no rows found
# - PGRST116 error code → Only occurs with .single(), NOT with .maybeSingle()
# - Always handle actual errors first, then check !data
# - Never check for PGRST116 when using .maybeSingle()

# Files fixed:
# - lib/actions/auth-actions.ts ✅ Fixed (3 locations)
```

### **15. Type Error: `Property 'is_suspended' does not exist on type ...`**
```bash
# Error: Property 'is_suspended' does not exist on type 'profiles'
# Error: Property 'suspension_reason' does not exist on type 'profiles'
# Root Cause: Migration adding suspension columns ran, but types/database.ts wasn't regenerated

# ❌ WRONG - Stale types (no suspension columns)
const { data: profile } = await supabase
  .from("profiles")
  .select("role, is_suspended")
  .eq("id", user.id)
  .maybeSingle();  # TS2339: Property 'is_suspended' does not exist

# ✅ FIX - Keep schema, types, and docs in sync
supabase db push --linked   # Applies migration locally (if needed)
npm run types:regen         # Regenerates types/database.ts with AUTO-GENERATED banner
npm run build               # Verifies middleware + server actions compile

# Prevention checklist:
# 1. Update database_schema_audit.md BEFORE adding migration
# 2. Run the migration locally (db push/reset)
# 3. Regenerate types via pinned CLI (npm run types:regen)
# 4. Re-run build/lint so middleware sees the new columns
```

---

## 🔍 **QUICK DIAGNOSIS**

| Error Message | Root Cause | Quick Fix |
|---------------|------------|-----------|
| `types/database.ts is out of sync` | Schema drift | `npm run types:regen` |
| `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'` | Wrong import path | Use `@/lib/supabase-admin-client` |
| `Cannot find module '@/types/database'` | Wrong type import | Use `@/types/supabase` |
| `Property 'role' does not exist on type 'never'` | Database type not imported | Import from `@/types/supabase` |
| `Failed to construct 'URL': Invalid URL` | SafeImage component | Check image src validation |
| `Cannot find module './console'` (Playwright MCP) | Corrupted npx cache | Use `--no-install` flag in MCP config |
| `No server info found` (Playwright MCP) | MCP server not connecting | Install locally + restart Cursor |
| `406 Not Acceptable` (Supabase) | Using `.single()` when row might not exist | Replace with `.maybeSingle()` |
| `Cannot find name 'talentProfile'` (TypeScript) | Variable out of scope | Check variable scope, wrap case blocks in braces |
| `ReferenceError: createNameSlug is not defined` | Missing import for utility function | Add `import { createNameSlug } from "@/lib/utils/slug";` |
| `ReferenceError: [function] is not defined` | Using function without import | Check file imports, add missing import statement |
| `N+1 API Call` (Sentry) - Multiple profile queries | Duplicate profile queries in components | Use `profile` from `useAuth()` instead of fetching separately |
| `PGRST200` - Foreign key relationship error | Invalid join between tables without direct FK | Fetch separately using intermediate table (e.g., profiles) |
| `column 'first_name' does not exist on 'talent_id'` | Invalid join - talent_id references profiles, not talent_profiles | Use `talent_profiles.user_id = talent_id` instead of direct join |
| `import/order` warnings | Incorrect import order | Run `npm run lint -- --fix` or reorder: external → react → internal → types |
| `@typescript-eslint/no-unused-vars` | Unused imports or variables | Remove unused imports, prefix unused variables with `_` |
| `Type '... | undefined' is not assignable to type '... | null'` | `.find()` returns `undefined`, variable typed as `null` | Use `?? null` to convert: `array.find(...) ?? null` |
| Syntax error: `profileError. ===` (missing property) | Incomplete error check with PGRST116 | Use `!profile` check with `.maybeSingle()`, don't check PGRST116 |
| Logic error: Checking PGRST116 with `.maybeSingle()` | PGRST116 only occurs with `.single()`, not `.maybeSingle()` | Handle errors first, then check `!profile` - no PGRST116 check needed |
| `Property 'is_suspended' does not exist on type 'profiles'` | Types out of sync after suspension migration | Run new migration locally, then `npm run types:regen` |
| Errors not in Sentry | Wrong DSN or project ID | Check `/api/sentry-diagnostic`, verify DSN ends in `4510191108292609` |

---

## 🚨 **PRE-PUSH CHECKLIST (30 seconds)**

```bash
# 1. Schema check
npm run schema:verify:comprehensive

# 2. Build test
npm run build

# 3. Lint check
npm run lint

# 4. If all pass, push
git push origin <branch>
```

---

## 🎯 **BRANCH-SPECIFIC COMMANDS**

### **DEVELOP Branch:**
```bash
npm run types:regen:dev
npm run build
git push origin develop
```

### **MAIN Branch:**
```bash
npm run types:regen:prod
npm run build
git push origin main
```

---

## ⚠️ **NEVER DO THESE**

1. ❌ Push code that doesn't build locally
2. ❌ Use `@/lib/supabase/supabase-admin-client` (extra `/supabase/`)
3. ❌ Use `@/types/database` (should be `/types/supabase`)
4. ❌ Use utility functions without importing them (e.g., `createNameSlug`, `getTalentSlug`)
5. ❌ Skip schema verification before pushing to main
6. ❌ Manually edit `types/database.ts` (it's auto-generated)
7. ❌ Join tables without direct foreign key relationships (check database_schema_audit.md first)
8. ❌ Use `talent_profiles:talent_id()` join (talent_id references profiles.id, not talent_profiles directly)

---

## ✅ **ALWAYS DO THESE**

1. ✅ Run `npm run build` before pushing
2. ✅ Use correct import paths
3. ✅ Import all utility functions you use (check `lib/utils/` directory)
4. ✅ Verify imports exist when refactoring or copying code between files
5. ✅ Regenerate types for correct environment
6. ✅ Check schema sync before pushing to main
7. ✅ Check database_schema_audit.md for FK relationships before joining tables
8. ✅ Fetch related data separately when no direct FK exists (through intermediate tables)
9. ✅ Remove unused imports when refactoring
10. ✅ Convert `undefined` to `null` when using `.find()`: `array.find(...) ?? null`
11. ✅ Use `Type | null` consistently, never `Type | undefined` for database/nullable types
12. ✅ With `.maybeSingle()`, handle errors first, then check `!data` - don't check PGRST116
13. ✅ Use `profile` from `useAuth()` in client components to avoid N+1 queries
14. ✅ Read `docs/PRE_PUSH_CHECKLIST.md` for full guidance

---

## 🆘 **EMERGENCY CONTACTS**

- **Full Checklist:** `docs/PRE_PUSH_CHECKLIST.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING_GUIDE.md`
- **Schema Guide:** `docs/SCHEMA_SYNC_FIX_GUIDE.md`
- **Project Rules:** `.cursorrules`

**Remember: Fix locally, then push!**
