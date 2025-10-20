# 🔧 TOTL Troubleshooting Guide

**Last Updated:** October 20, 2025  
**Status:** Production Ready

This guide covers common issues encountered during development and deployment, with step-by-step solutions based on real debugging sessions.

## 🚨 Critical Issues & Solutions

### 1. Server Component Render Error - Event Handlers in Server Components

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

## 📞 Getting Help

### Error Investigation Checklist
1. Check the exact error message and digest
2. Verify environment variables are set
3. Confirm Supabase CLI version consistency
4. Test in both development and production modes
5. Check for recent schema or dependency changes

### Common False Positives
- Type imports from `@supabase/supabase-js` (allowed)
- Auth helper usage from `@supabase/auth-helpers-nextjs` (allowed)
- Manual interfaces in UI components (warning, not error)

### When to Escalate
- Persistent build failures after following guides
- Schema verification loops despite correct setup
- Production errors with unclear digest messages
- Performance issues in CI/CD pipeline

---

*This guide is updated based on real debugging sessions and production issues. Keep it current as new patterns emerge.*
