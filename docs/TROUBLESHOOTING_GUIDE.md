# 🔧 TOTL Troubleshooting Guide

**Last Updated:** October 19, 2025  
**Status:** Production Ready

This guide covers common issues encountered during development and deployment, with step-by-step solutions based on real debugging sessions.

## 🚨 Critical Issues & Solutions

### 1. "Cookies can only be modified in a Server Action or Route Handler"

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

### 2. "Missing Supabase environment variables"

**Error Message:**
```
Error: Missing Supabase environment variables
    at createSupabaseServerClient (lib/supabase-client.ts:12)
```

**Root Cause:** Environment variables not available during build or runtime.

**Solution:**
1. **Check local environment:**
   ```bash
   # Verify .env.local exists and contains:
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

2. **Check deployment environment:**
   - Vercel: Project Settings → Environment Variables
   - Ensure variables are set for correct environment (Preview/Production)
   - No trailing spaces or newlines in values

3. **Force Node.js runtime if using Edge:**
   ```ts
   // app/settings/page.tsx
   export const runtime = 'nodejs'; // Instead of 'edge'
   ```

### 3. Schema Verification Failures

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

### 4. Build Failures with "Binary files differ"

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

### 5. "Requested range not satisfiable" (416 Error)

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
