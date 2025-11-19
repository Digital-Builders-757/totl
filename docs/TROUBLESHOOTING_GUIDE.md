# 🔧 TOTL Troubleshooting Guide

**Last Updated:** November 16, 2025  
**Status:** Production Ready

This guide covers common issues encountered during development and deployment, with step-by-step solutions based on real debugging sessions.

## 🚨 Critical Issues & Solutions

### 0. Database Trigger Error - Column Does Not Exist in Profiles

**Error Message:**
```
ERROR: column "email" of relation "profiles" does not exist (SQLSTATE 42703)
500: Database error saving new user
```

**Symptoms:**
- ❌ All new user signups fail (talent and client)
- ❌ Error occurs during account creation
- ✅ Existing users can still log in

**Root Cause:** The `handle_new_user()` database trigger function is trying to insert into a non-existent column. This typically happens when:
1. Schema was changed but trigger function wasn't updated
2. Multiple migration files have conflicting versions of the function
3. Production database has stale function definition

**Solution:**

1. **Verify the actual schema:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   ORDER BY ordinal_position;
   ```

2. **Check current trigger function:**
   ```sql
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. **Run the emergency fix:**
   - Use `EMERGENCY_FIX_SIGNUP.sql` in the project root
   - Or manually run the corrected function in Supabase SQL Editor

4. **Correct version (as of Oct 2025):**
   ```sql
   INSERT INTO public.profiles (id, role, display_name, email_verified)
   VALUES (new.id, user_role::user_role, display_name, new.email_confirmed_at IS NOT NULL);
   ```

**Prevention:**
- ✅ **ALWAYS** check `database_schema_audit.md` before modifying triggers
- ✅ **ALWAYS** read `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md` before auth changes
- ✅ Search all migration files for conflicting function definitions
- ✅ Test signup flow after ANY database trigger changes

**Related Documentation:**
- `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md` - **MANDATORY** pre-flight checklist
- `docs/SIGNUP_DATABASE_ERROR_FIX_OCT_23_2025.md` - Complete incident report
- `database_schema_audit.md` - Schema single source of truth
- `EMERGENCY_FIX_SIGNUP.sql` - Emergency fix script

---

### 1. SafeImage URL Validation Error - Invalid URL Constructor

**Error Message:**
```
Failed to construct 'URL': Invalid URL
    at SafeImage (components\ui\safe-image.tsx:72:9)
```

**Symptoms:**
- ❌ Talent discovery page crashes when loading
- ❌ Error occurs in SafeImage component when rendering talent profiles
- ❌ Next.js Image component receives invalid URL format

**Root Cause:** The SafeImage component was not validating URLs before passing them to the Next.js Image component. Invalid URLs (malformed, empty, or with invalid protocols) cause the URL constructor to throw an error.

**Common Invalid URL Scenarios:**
- Empty strings or null values in `avatar_url`, `avatar_path`, or `portfolio_url`
- Malformed URLs in database (missing protocol, invalid characters)
- URLs that don't start with `/`, `http`, or `data:`

**Solution:**

1. **Enhanced URL validation in SafeImage component:**
   ```tsx
   // Validate URL format before using it
   const isValidUrl = (url: string): boolean => {
     try {
       new URL(url);
       return true;
     } catch {
       return false;
     }
   };

   // Handle empty strings, null values, and invalid URLs
   const shouldUseFallback = !src || 
     src.trim() === "" || 
     (!src.startsWith('/') && !src.startsWith('http') && !src.startsWith('data:')) ||
     (src.startsWith('http') && !isValidUrl(src));
   ```

2. **Debug logging for invalid URLs:**
   ```tsx
   if (src && shouldUseFallback && src !== fallbackSrc) {
     console.warn(`SafeImage: Invalid URL detected in ${context}:`, {
       src,
       reason: !src ? 'null/undefined' : 
               src.trim() === "" ? 'empty string' :
               (!src.startsWith('/') && !src.startsWith('http') && !src.startsWith('data:')) ? 'invalid protocol' :
               'invalid URL format'
     });
   }
   ```

**Prevention:**
- ✅ Always validate URLs before passing to Next.js Image component
- ✅ Use fallback images for invalid or missing URLs
- ✅ Add debug logging to identify data quality issues
- ✅ Check database for malformed URLs in `avatar_url`, `avatar_path`, `portfolio_url` fields

**Related Files:**
- `components/ui/safe-image.tsx` - Enhanced with URL validation
- `app/talent/talent-client.tsx` - Uses SafeImage for talent profile images
- `app/talent/page.tsx` - Fetches talent data with image URLs

---

### 2. Server Component Render Error - Event Handlers in Server Components

**Error Messages (two related errors):**
```
Error: An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.
```
OR
```
Error: Event handlers cannot be passed to Client Component props.
  {onClick: function onClick, className: ..., children: ...}
            ^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
```

**Root Cause:** Using client-side event handlers (like `onClick`, `onChange`, etc.) or browser APIs (like `window`) in Server Components, or passing event handlers as props from Server to Client Components. Server Components render on the server and cannot have client-side interactivity or serialize functions.

**Common Violations:**
```tsx
// ❌ Wrong - onClick in Server Component
export default async function Page() {
  return <Button onClick={() => window.location.reload()}>Refresh</Button>;
}

// ❌ Wrong - Passing function from Server to Client Component
export default async function ServerPage() {
  const handleClick = () => console.log("clicked");
  return <ClientButton onClick={handleClick} />; // Cannot serialize functions!
}

// ❌ Wrong - Browser API in Server Component  
export default async function Page() {
  const url = window.location.href; // window doesn't exist on server
  return <div>{url}</div>;
}
```

**Solution:**
1. **Extract client-interactive parts to a Client Component:**
```tsx
// error-state.tsx (Client Component)
"use client";
import { Button } from "@/components/ui/button";

export function ErrorState({ message }: { message: string }) {
  return (
    <div>
      <p>{message}</p>
      <Button onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  );
}

// page.tsx (Server Component)
import { ErrorState } from "./error-state";

export default async function Page() {
  return <ErrorState message="Something went wrong" />;
}
```

2. **For callbacks, use data instead of functions:**
```tsx
// ❌ Wrong - Passing function as prop
export default async function ServerPage() {
  const items = getItems();
  return <ClientList items={items} onDelete={(id) => deleteItem(id)} />;
}

// ✅ Correct - Let client component handle the action
export default async function ServerPage() {
  const items = getItems();
  return <ClientList items={items} />; // Client handles deletion via API route
}
```

3. **Or mark the entire page as a Client Component (last resort):**
```tsx
"use client"; // Add this at the top

export default function Page() {
  return <Button onClick={() => window.location.reload()}>Refresh</Button>;
}
```

**When to use each approach:**
- Use approach #1 when you want to keep data fetching on the server (recommended)
- Use approach #2 when you need to coordinate server data with client actions
- Use approach #3 when the entire page needs client-side interactivity (loses server benefits)

**Prevention:**
- Always check if your component has `"use client"` before adding event handlers
- **Never pass functions as props from Server to Client Components** - functions cannot be serialized
- Pass data IDs instead of callbacks - let the client component call API routes/Server Actions
- Remember: no `onClick`, `onChange`, `onSubmit`, etc. in Server Components
- Keep Server Components for data fetching, Client Components for interactivity

### 2. Webpack HMR Errors (Development Only)

**Error Messages:**
```
TypeError: Cannot read properties of undefined (reading 'call')
    at webpack/bootstrap
    at __webpack_modules__[moduleId].call
```
OR
```
Error: Cannot find module './6141.js'
Require stack:
- .next/server/webpack-runtime.js
- .next/server/pages/_document.js
```

**Root Cause:** These are Next.js **development-only** errors that occur during Hot Module Replacement (HMR) / Fast Refresh when:
- The webpack module cache becomes corrupted
- Webpack chunks (numbered .js files) can't be found
- The `.next` build folder is out of sync with source code
- A module fails to load properly during hot reload
- Circular dependencies are detected during Fast Refresh
- Components are rapidly edited and saved

**Impact:** Development experience only - does not affect production (0 users affected)

**Solution:**

**✅ Already filtered in Sentry** - These errors are now automatically filtered in development mode

**To fix locally:**
1. **Restart the development server:**
   ```bash
   # Stop the dev server (Ctrl+C)
   npm run dev
   ```

2. **Clear Next.js cache if issue persists:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check for circular dependencies:**
   - Review recent component imports
   - Ensure components don't import each other in a loop
   - Use `"use client"` directives appropriately

**Prevention:**
- These errors are filtered in development Sentry logs to reduce noise
- They appear in the console so developers can see them
- Restarting dev server usually resolves them
- In production, these don't occur due to static bundling

### 3. Sentry Error: "write EPIPE" (Next.js Dev Server)

**Error Message:**
```
Error: write EPIPE
    at afterWriteDispatched (node:internal/stream_base_commons)
    at writeGeneric (node:internal/stream_base_commons)
    at Socket._writeGeneric (node:net)
```

**Root Cause:** The Next.js development server tries to write request logs to `stdout`, but the terminal/console stream has been interrupted or closed. This is a harmless system-level error that occurs when:
- The terminal is closed while the dev server is running
- The stdout pipe is disconnected
- A parent process terminates unexpectedly

**Impact:** None - this is a non-critical error that doesn't affect functionality

**Solution:** Already fixed in `sentry.server.config.ts` and `sentry.edge.config.ts` by:
1. Adding EPIPE errors to the `ignoreErrors` list
2. Implementing a `beforeSend` hook to filter out these errors before sending to Sentry
3. Checking for error code `EPIPE` (errno -32) and blocking those events

**Prevention:**
- These errors are now automatically filtered and won't appear in Sentry
- If you see them in local console, they can be safely ignored
- They only occur in development mode with the Next.js dev server

### 4. "Cookies can only be modified in a Server Action or Route Handler"

**Error Message:**
```
Error: Cookies can only be modified in a Server Action or Route Handler
    at Object.remove (.next/server/app/settings/page.js:12:7080)
```

**Root Cause:** Server Components trying to modify cookies during rendering.

**Solution:**
```ts
// ❌ Wrong - Server Component with writable cookies
import { createSupabaseActionClient } from "@/lib/supabase-client";
const supabase = await createSupabaseActionClient(); // Can modify cookies

// ✅ Correct - Server Component with read-only cookies
import { createSupabaseServerClient } from "@/lib/supabase-client";
const supabase = await createSupabaseServerClient(); // Read-only
```

**When to use each:**
- **Server Components** (pages, layouts): Use `createSupabaseServerClient()`
- **Server Actions** (`'use server'`): Use `createSupabaseActionClient()`
- **Route Handlers** (`app/api/**/route.ts`): Use `createSupabaseActionClient()`

### 5. "Missing Supabase environment variables" (Middleware/Edge Runtime)

**Error Message:**
```
Error: Your project's URL and Key are required to create a Supabase client!
Check your Supabase project's API settings to find these values
https://supabase.com/dashboard/project/_/settings/api
```
OR
```
Error: Missing Supabase environment variables
    at createSupabaseServerClient (lib/supabase-client.ts:12)
```

**Root Cause:** Environment variables not available during build, runtime, or in Edge runtime middleware. This commonly happens when:
- Environment variables aren't set in Vercel/deployment platform
- Edge runtime middleware tries to access vars before they're loaded
- Preview deployments don't inherit environment variables properly
- Local `.env.local` file is missing or not properly formatted

**Solution:**

**✅ Fixed in `middleware.ts`** - Now gracefully handles missing environment variables:
- Validates environment variables before creating Supabase client
- Logs detailed error information for debugging
- Allows auth routes to continue (user will see login page)
- Redirects protected routes to login
- Allows public routes to continue normally

**Manual verification steps:**

1. **Check local environment:**
   ```bash
   # Verify .env.local exists and contains:
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

2. **Check deployment environment:**
   - **Vercel:** Project Settings → Environment Variables
   - Ensure variables are set for correct environment (Preview/Production)
   - Verify no trailing spaces or newlines in values
   - **Important:** Preview deployments need explicit environment variable configuration

3. **Verify middleware configuration:**
   ```ts
   // middleware.ts should validate before using
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
   
   if (!supabaseUrl || !supabaseAnonKey) {
     // Handle gracefully - don't crash
     console.error("Missing env vars");
     return fallbackResponse;
   }
   ```

4. **Force Node.js runtime if using Edge causes issues:**
   ```ts
   // app/settings/page.tsx
   export const runtime = 'nodejs'; // Instead of 'edge'
   ```

**Prevention:**
- Always validate environment variables before using them (especially in Edge runtime)
- Never use non-null assertion (`!`) with `process.env` values
- Set up environment variables for all deployment environments (preview, production, development)

### 6. Schema Verification Failures

**Error Message:**
```
ERROR: types/database.ts is out of sync with remote schema
```

**Root Cause:** Local types file doesn't match remote Supabase schema.

**Solution:**
```bash
# Regenerate types with exact CLI version
npm run types:regen

# Or manually:
npx supabase@v2.33.4 gen types typescript --linked --schema public > types/database.ts
```

**Prevention:**
- Always use migrations for schema changes
- Run `npm run types:regen` after schema changes
- Never hand-edit `types/database.ts`

### 7. Build Failures with "Binary files differ"

**Error Message:**
```
Binary files differ
types/database.ts contains UTF-8 BOM or wrong line endings
```

**Root Cause:** File encoding or line ending issues.

**Solution:**
```bash
# Use the proper regeneration script
npm run types:regen

# This ensures BOM-less UTF-8 and LF line endings
```

**Technical Details:**
- Windows PowerShell can add UTF-8 BOM
- Git line ending normalization required
- CI expects exact byte-for-byte match

### 8. "Requested range not satisfiable" (416 Error)

**Error Message:**
```
Error: Requested range not satisfiable
Code: PGRST103
Details: An offset of 9 was requested, but there are only 7 rows.
```

**Root Cause:** Pagination logic requesting data beyond available rows.

**Solution:**
```ts
// ❌ Wrong - No validation
const from = (page - 1) * pageSize;
const { data } = await query.range(from, from + pageSize - 1);

// ✅ Correct - Validate before querying
const { count } = await query.select("*", { count: "exact", head: true });
const totalPages = Math.max(1, Math.ceil(count / pageSize));
const validPage = Math.min(page, totalPages);
const from = (validPage - 1) * pageSize;

if (count > 0) {
  const { data } = await query.range(from, from + pageSize - 1);
}
```

**Prevention:**
- Always get the count before applying range queries
- Validate page numbers against total pages
- Handle edge cases (0 results, invalid pages)

**Reference:** See `docs/GIGS_PAGINATION_416_ERROR_FIX.md` for detailed implementation

### 9. Playwright MCP "Cannot find module './console'" Error

**Error Message:**
```
Error: Cannot find module './console'
Require stack:
  ...\node_modules\playwright-core\lib\server\page.js
  ...\node_modules\@playwright\mcp\cli.js
```

**Symptoms:**
- ❌ Playwright MCP server fails to connect in Cursor
- ❌ "No server info found" error in Cursor
- ❌ Test timeouts during `beforeEach` hooks
- ❌ MCP tools don't appear in Cursor chat

**Root Cause:** The Playwright MCP process crashes because the local `playwright-core` install in the **npx cache is broken/incomplete**. When `page.js` tries to `require('./console')`, the file is missing from the temp cache folder.

**Why This Happens:** `npx @playwright/mcp@latest` downloads a fresh copy into a temp folder (`C:\Users\...\AppData\Local\npm-cache\_npx\...`) every time. If that download gets corrupted or partially completes, files like `console.js` are missing, and MCP dies before Cursor can list any tools.

**Solution:**

1. **Install packages locally:**
   ```powershell
   npm install --save-dev playwright @playwright/test @playwright/mcp --legacy-peer-deps
   npx playwright install --with-deps chromium
   ```

2. **Update Cursor MCP config** (`c:\Users\young\.cursor\mcp.json`):
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": [
           "--no-install",
           "@playwright/mcp",
           "--browser=chromium",
           "--headless",
           "--allowed-hosts=localhost,totl-agency.vercel.app",
           "--test-id-attribute=data-testid"
         ],
         "env": {}
       }
     }
   }
   ```

3. **Verify the command works:**
   ```powershell
   npx --no-install @playwright/mcp --browser=chromium --headless --allowed-hosts=localhost,totl-agency.vercel.app --test-id-attribute=data-testid --help
   ```
   Should output help text, not errors.

4. **Restart Cursor completely:**
   - Close ALL Cursor windows
   - Wait 5 seconds
   - Reopen Cursor
   - Playwright MCP should now connect

**Key Change:** The `--no-install` flag tells `npx` to **only use node_modules in this repo, don't download anything**. This dodges the temp-cache corruption entirely.

**Prevention:**
- Always install MCP packages locally in `package.json`
- Use `--no-install` flag in MCP config to bypass npx cache
- Verify installation with manual command before restarting Cursor
- Keep server name lowercase for consistency

**Related Documentation:**
- `docs/MCP_PLAYWRIGHT_TROUBLESHOOTING.md` - Complete troubleshooting guide
- `docs/MCP_QUICK_FIX.md` - Quick 2-step fix guide

**Status:** ✅ **RESOLVED** (November 16, 2025)

---

## 🔍 Debugging Strategies

### Production Error Diagnosis

1. **Find the real error message:**
   ```
   Application error: a server-side exception has occurred
   Digest: 3540001675
   ```
   - Check deployment logs for the digest number
   - Look in Vercel Functions/Logs or server console

2. **Reproduce locally in production mode:**
   ```bash
   npm run build
   npm run start
   # Navigate to failing page
   ```

3. **Check runtime configuration:**
   ```ts
   // Force Node.js runtime for Supabase operations
   export const runtime = 'nodejs';
   ```

### Schema Sync Issues

1. **Quick verification:**
   ```bash
   npm run schema:verify-fast
   ```

2. **Full schema check:**
   ```bash
   npm run schema:verify-local
   ```

3. **Manual comparison:**
   ```bash
   npx supabase@v2.33.4 gen types typescript --linked --schema public > temp_types.ts
   diff temp_types.ts types/database.ts
   ```

## 📋 Best Practices

### Environment Setup
- Use consistent Supabase CLI version (`v2.33.4`)
- Set up `.env.local` with all required variables
- Use `npx` to avoid global CLI version conflicts

### Code Organization
- Server Components: Read-only database operations
- Server Actions: Write operations, auth changes
- Client Components: UI interactions, browser APIs

### Type Safety
- Always use generated types from `types/database.ts`
- Import types: `import type { Database } from "@/types/supabase"`
- Avoid manual interface definitions for DB entities

### Schema Management
- Use migrations for all schema changes
- Update `database_schema_audit.md` before changes
- Regenerate types after schema changes
- Never edit generated files manually

## 🚀 Performance Optimization

### Schema Verification
- Use `-SkipDbGeneration` flag in CI for speed
- Run full verification only when needed
- Focus on project files, exclude node_modules

### Build Optimization
- Use Server Components for data fetching
- Minimize client-side JavaScript
- Leverage Next.js static generation where possible

## 📊 Performance Issues

### 8. N+1 Query Issue - Multiple Profile Queries

**Error Message:**
```
Sentry: "N+1 API Call"
Repeating Spans: /rest/v1/profiles?id=*&select=*
5+ duplicate profile queries per page load
```

**Symptoms:**
- ⚠️ Sentry shows "N+1 API Call" warnings
- 🐌 Slow page loads on dashboard pages
- 📊 Network tab shows 5+ identical profile queries
- 💾 Excessive database load

**Root Cause:** Multiple components fetching the same profile data separately instead of using cached data from auth provider.

**Solution:**

#### **Step 1: Use Profile from Auth Context**

```typescript
// ✅ CORRECT - Use profile from auth provider (single query)
import { useAuth } from "@/components/auth/auth-provider";

function Dashboard() {
  const { user, profile } = useAuth();
  
  // Profile data is already available:
  // - profile.role
  // - profile.avatar_url
  // - profile.avatar_path
  // - profile.display_name
  
  return <Avatar src={profile?.avatar_url} />;
}
```

#### **Step 2: Remove Duplicate Profile Queries**

```typescript
// ❌ WRONG - Don't fetch profile separately
const [userProfile, setUserProfile] = useState(null);
useEffect(() => {
  supabase
    .from("profiles")
    .select("avatar_url, display_name")
    .eq("id", user.id)
    .single()
    .then(({ data }) => setUserProfile(data));
}, [user]);
```

#### **Step 3: Verify Fix**

1. Check Sentry - should show 0 or 1 profile query per page load
2. Network tab - verify single profile query in requests
3. Performance - page load should be faster

**Prevention:**
- ✅ Always use `profile` from `useAuth()` in client components
- ✅ Only query profiles separately in server components (routing decisions)
- ✅ Check Sentry for N+1 query warnings after changes
- ✅ Review network tab for duplicate queries

**Files Fixed (January 2025):**
- ✅ `app/talent/dashboard/page.tsx`
- ✅ `app/client/dashboard/page.tsx`
- ✅ `app/talent/[slug]/talent-profile-client.tsx`

**Impact:** Reduced 5+ profile queries to 1 query per session (cached in auth context).

**See:** `docs/AUTH_STRATEGY.md` for complete auth provider documentation.

---

## 📞 Getting Help

### Error Investigation Checklist
1. Check the exact error message and digest
2. Verify environment variables are set
3. Confirm Supabase CLI version consistency
4. Test in both development and production modes
5. Check for recent schema or dependency changes
6. Review Sentry for N+1 query warnings
7. Check network tab for duplicate API calls

### Common False Positives
- Type imports from `@supabase/supabase-js` (allowed)
- Auth helper usage from `@supabase/auth-helpers-nextjs` (allowed)
- Manual interfaces in UI components (warning, not error)
- Server component profile queries (OK - needed for routing)

### When to Escalate
- Persistent build failures after following guides
- Schema verification loops despite correct setup
- Production errors with unclear digest messages
- Performance issues in CI/CD pipeline
- N+1 query issues after using auth provider profile

---

*This guide is updated based on real debugging sessions and production issues. Keep it current as new patterns emerge.*
