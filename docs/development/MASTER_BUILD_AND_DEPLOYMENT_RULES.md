# 🎯 Master Build & Deployment Rules

**Created:** December 2025  
**Last Updated:** December 2025  
**Purpose:** Consolidated master list for prerender/browser-client fixes and ongoing management for **Supabase + Vercel + Sentry + Resend** in TOTL (server-safe, RLS-safe, build-safe).

---

## 🛡️ Enforced Invariants (Non-Negotiable)

These rules are **enforced by automated audits** and **must not be violated**. Each invariant includes:
- **Why:** The reason this rule exists
- **How we detect violations:** The automated check that catches it
- **Fix pattern:** How to resolve violations

---

### Invariant 1: Client Boundary

**Rule:** `lib/supabase/supabase-browser.ts` is `"use client"` and throws on server (`typeof window === 'undefined'`). Any import of `supabase-browser` must only appear in `"use client"` files.

**Why:** Prevents prerender/build failures. Browser Supabase client uses `window`/`localStorage` which don't exist during SSR. Importing it in server components causes "createSupabaseBrowser() can only be called in the browser" errors.

**How we detect violations:** `npm run audit:client-boundaries` scans only `app/`, `lib/`, `components/`, `hooks/` directories for browser client imports and checks for `"use client"` directive. The audit also guards against new top-level directories (`src/`, `features/`, `packages/`, etc.) that aren't in the scan scope.

**Fix pattern:**
```tsx
// ❌ WRONG - Server component
// app/some-page/page.tsx
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";

// ✅ CORRECT - Client component
// app/some-page/client.tsx
"use client";
import { useSupabase } from "@/lib/hooks/use-supabase";

export function SomeClientComponent() {
  const supabase = useSupabase();
  // ...
}
```

---

### Invariant 2: Server Boundary

**Rule:** All DB writes go through **Server Actions** (or route handlers), never client components. Service role key never leaks into client bundle.

**Why:** Security and RLS enforcement. Client-side writes bypass RLS policies and expose service role keys. Server-side writes respect RLS and keep secrets safe.

**How we detect violations:** `npm run guard:client-writes` scans for Supabase write operations in client components. (Note: This guard exists and is part of the broader verification suite.)

**Fix pattern:**
```tsx
// ❌ WRONG - Client component doing DB write
"use client";
export function MyComponent() {
  const supabase = useSupabase();
  await supabase.from("table").insert({ data }); // ❌
}

// ✅ CORRECT - Server Action
// app/actions.ts
"use server";
export async function createRecord(data) {
  const supabase = createServerClient();
  await supabase.from("table").insert({ data });
}
```

---

### Invariant 3: Query Discipline

**Rule:** No `select('*')` — explicit columns only. `.single()` only when row is guaranteed; otherwise `.maybeSingle()`.

**Why:** 
- `select('*')` exposes all columns including sensitive fields and breaks when schema changes
- `.single()` throws 406/PGRST116 errors when row doesn't exist, causing Sentry noise and broken flows

**How we detect violations:** 
- `npm run audit:select-star` finds `select('*')` usage (fails build)
- `npm run audit:single-vs-maybe-single` finds all `.single()` calls for human review (warns)

**Fix pattern:**
```tsx
// ❌ WRONG
const { data } = await supabase
  .from("talent_profiles")
  .select("*") // ❌ Too broad
  .eq("user_id", id)
  .single(); // ❌ Throws if doesn't exist

// ✅ CORRECT
const { data } = await supabase
  .from("talent_profiles")
  .select("id, first_name, last_name") // ✅ Explicit columns
  .eq("user_id", id)
  .maybeSingle(); // ✅ Returns null if doesn't exist
```

**Rule of thumb:** Use `.single()` only when **you can prove existence** by design (e.g., `profiles` after signup trigger creates it). Use `.maybeSingle()` for optional role-specific tables (`talent_profiles`, `client_profiles`), lookup queries, and "has applied already?" checks.

**Policy Decision (December 2025):**
- ✅ **`.single()` is allowed for:**
  - Queries where the record MUST exist (e.g., after a successful insert)
  - Internal operations where missing data indicates a bug
  - Admin operations with guaranteed data (e.g., fetching by primary key after verification)
  - Utility functions in `lib/safe-query.ts` that document their guarantees
  
- ⚠️ **`.single()` is discouraged for:**
  - User-input-driven queries (e.g., fetching by user-provided ID)
  - Profile queries (`profiles`, `talent_profiles`, `client_profiles`) - use `.maybeSingle()`
  - Authentication/authorization checks - use `.maybeSingle()`
  - Any query where the record might not exist
  
- 📊 **Audit behavior:**
  - Currently: Warns (doesn't fail) - allows migration period
  - Future: May be made to fail in CI once codebase is fully migrated
  - All `.single()` usages are listed for human review

---

### Invariant 4: Env Discipline

**Rule:** Vercel Preview/Prod both set the same required vars. `NEXT_PUBLIC_*` only for anon/browser-safe values.

**Why:** Missing env vars cause "zombie dashboards" (silent failures) or hard crashes. Public env vars are bundled into client code at build time.

**How we detect violations:** `npm run env:check` verifies required env vars are present.

**Fix pattern:**
- Set in Vercel dashboard → Settings → Environment Variables
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist for **Production** environment
- Never expose service role keys as `NEXT_PUBLIC_*`

---

## 1) Supabase Client Rules (So Builds Don't Explode)

### ✅ Browser Client Lives in `"use client"` Module Only

- Your `lib/supabase/supabase-browser.ts` pattern is correct: it hard-crashes if called server-side (prevents "zombie dashboards").
- **Rule:** Any file that calls `createSupabaseBrowser()` MUST have `"use client";` at the top.

### ✅ Never Import Browser-Only Supabase Code into Server Files

- Any `app/**/page.tsx` server component, server action, route handler, or middleware must **NOT** touch browser client code.
- **Violation Pattern:** `import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser"` in a server component.

### ✅ Use Hook Wrapper for Client Components

- Client components should obtain the browser client via `useSupabase()` hook (or similar client-only adapter), not by calling "create browser client" in shared modules.
- **Pattern:**
  ```tsx
  "use client";
  import { useSupabase } from "@/lib/hooks/use-supabase";
  
  export function MyComponent() {
    const supabase = useSupabase(); // ✅ Correct
    // ...
  }
  ```

### ✅ Server-Side Work Uses Server/Admin Client Only

- Server components fetch data using server client.
- Server Actions perform mutations using server/admin client.
- Keep service role key **server-only**, always.

---

## 2) The "createSupabaseBrowser Can Only Be Called in the Browser" Fix (Prerender-Safe Pattern)

### ✅ Any File Calling `createSupabaseBrowser()` Must Be Explicitly Client

- Add `"use client";` at the top of that module.
- **Check:** Run `npm run audit:client-boundaries` to find violations.

### ✅ Never Call `createSupabaseBrowser()` During Render

- **Rule:** Never call `createSupabaseBrowser()` during render (component body, module scope, memo initializers)
- **Why:** Client Components may render on the server for initial HTML (RSC pipeline). Browser-only code must run after mount.
- **Allowed locations:**
  - `useEffect(() => { ... })`
  - `useLayoutEffect(() => { ... })`
  - Event handlers (async functions, arrow functions)
  - Lazy initializers that only run client-side
- **Pattern:** Use ref + accessor pattern for components that need the client throughout:
  ```tsx
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      supabaseRef.current = createSupabaseBrowser();
    }
  }, []);
  
  const getSupabase = () => {
    if (!supabaseRef.current) throw new Error("Not initialized");
    return supabaseRef.current;
  };
  ```

### ✅ If You Need Auth + Profile in a Client Page

- Prefer `useAuth()` as the "truth source".
- Only use Supabase client for page-specific queries (avoid N+1 profile fetches).

### ✅ If a Route Uses `useSearchParams()`

- Keep it as a client component that redirects (your `app/talent/signup/client.tsx` approach is exactly the right shape).

---

## 3) Vercel Environment + Deployments (The "It Works Locally But Not in Prod" Killer)

### ✅ Set Environment Variables in Vercel for Each Environment

**Preview vs Production must both have:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only keys (service role, Resend, Sentry auth token, etc.) must **NOT** be exposed as `NEXT_PUBLIC_*`.

### ✅ Protect Against Missing Env at Runtime

- Browser client should throw if missing public env (you already do this in `supabase-browser.ts`).
- Server client should throw if missing server env.

### ✅ Branch Discipline

- `develop` and `main` must use the correct **types regen target** (dev vs prod project).
- **Check:** Run `npm run types:check` before merging to main.

---

## 4) Sentry Management (So You Catch Real Issues and Not Noise)

### ✅ Env Vars

- `SENTRY_DSN` (or the Next.js naming you're using)
- Optional: `SENTRY_AUTH_TOKEN` (only needed for releases/sourcemaps in CI)

### ✅ Verify It's Alive

- Keep a local diagnostic endpoint: `/api/sentry-diagnostic`
- Test error route: `/api/test-error`

### ✅ Don't Log User Secrets

- **Scrub tokens, cookies, and Authorization headers in `beforeSend`** (see `sentry.server.config.ts`).
- **Pattern:**
  ```ts
  beforeSend(event, hint) {
    // Scrub sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }
    // Scrub sensitive data from extra context
    if (event.extra) {
      // Remove tokens, keys, etc.
    }
    return event;
  }
  ```

### ✅ Fix the Common "Sentry 406 / Profile .single()" Chain

- Use `.maybeSingle()` when a record might not exist (prevents noisy Sentry + broken flows).
- **Common offenders:** `profiles`, `talent_profiles`, `client_profiles` queries.

### ✅ Tag Releases Per Deployment

- If you do sourcemaps/releases: set release version on Vercel deploy so stacktraces map correctly.
- Already configured in `next.config.mjs` with `SENTRY_AUTH_TOKEN`.

---

## 5) Resend Management (Transactional Email That Won't Break Auth Flows)

### ✅ Env Vars

- `RESEND_API_KEY` (server-only)
- `RESEND_FROM_EMAIL` (ex: a verified sender)

### ✅ Only Send Email from Server

- Route handlers / server actions only.
- Never from client components.

### ✅ Make Email Sending Failure-Safe

- If an email fails, the core DB mutation should still be consistent (or you explicitly rollback).
- **Pattern:** Log email failure but don't fail the transaction unless critical.

### ✅ Log Minimal Metadata

- Message id + template name + user id (no PII dumps).

---

## 6) "Don't Ship Broken" Checklist (Single Command Mental Model)

Before pushing **any** branch:

```bash
npm run pre-push:check
```

This runs:
1. `npm run schema:verify:comprehensive`
2. `npm run types:check`
3. `npm run build`
4. `npm run lint`
5. `npm run audit:client-boundaries` (new)
6. `npm run audit:single-vs-maybe-single` (new)

And if you're merging to **main**, make sure types were regenerated against **prod** schema:

```bash
npm run types:regen:prod
```

---

## 7) Quick Sanity Grep List (Fast Audits When Something Regresses)

### Find Forbidden Imports / Wrong Paths

```bash
# Find wrong admin client imports
grep -r "@/lib/supabase/supabase-admin-client" --include="*.tsx" --include="*.ts"

# Find wrong database type imports
grep -r "@/types/database" --include="*.tsx" --include="*.ts"
```

### Find Risky Supabase Patterns

```bash
# Find .single() on tables that may not exist yet (profiles especially)
grep -r "\.single()" --include="*.tsx" --include="*.ts" | grep -E "(profiles|talent_profiles|client_profiles)"
```

### Find Client/Server Boundary Leaks

```bash
# Find createSupabaseBrowser appearing in non-client files
grep -r "createSupabaseBrowser" --include="*.tsx" --include="*.ts" | grep -v "use client"
```

---

## 8) Common Violations & Fixes

### ❌ Violation: Browser Client in Server Component

**Error:** `createSupabaseBrowser() can only be called in the browser`

**Fix:**
```tsx
// ❌ WRONG
// app/some-page/page.tsx (server component)
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";

// ✅ CORRECT
// app/some-page/client.tsx
"use client";
import { useSupabase } from "@/lib/hooks/use-supabase";

export function SomeClientComponent() {
  const supabase = useSupabase();
  // ...
}
```

### ❌ Violation: `.single()` on Profile That Might Not Exist

**Error:** `Sentry 406` or `PGRST116` (no rows returned)

**Fix:**
```tsx
// ❌ WRONG
const { data: profile } = await supabase
  .from("talent_profiles")
  .select("*")
  .eq("user_id", user.id)
  .single(); // Crashes if profile doesn't exist

// ✅ CORRECT
const { data: profile } = await supabase
  .from("talent_profiles")
  .select("*")
  .eq("user_id", user.id)
  .maybeSingle(); // Returns null if profile doesn't exist
```

### ❌ Violation: Missing Env Vars in Production

**Error:** `Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Fix:**
1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for **Production** environment
3. Redeploy with cache cleared

---

## 9) Audit Scripts Reference

### `npm run audit:client-boundaries`
Finds files importing `createSupabaseBrowser` that aren't client components.

### `npm run audit:single-vs-maybe-single`
Finds `.single()` calls on tables that should use `.maybeSingle()`.

### `npm run audit:env-vars`
Checks for missing required environment variables.

### `npm run audit:all`
Runs all audit scripts.

---

## 10) File Structure Reference

```
lib/
  supabase/
    supabase-browser.ts    # ✅ Client-only, has "use client"
    supabase-server.ts     # ✅ Server-only
    supabase-admin-client.ts # ✅ Server-only, admin operations
  hooks/
    use-supabase.ts        # ✅ Client hook wrapper
```

---

## Quick Reference: What Goes Where?

| Use Case | File Type | Import From |
|----------|-----------|-------------|
| Client component needs Supabase | `"use client"` component | `useSupabase()` hook |
| Server component needs data | Server component | Server client from `lib/supabase/supabase-server.ts` |
| Server action mutation | Server action | Server/admin client |
| Route handler | Route handler | Server/admin client |
| Middleware | Middleware | Server client (no admin) |

---

**Last Updated:** December 2025  
**Maintained By:** TOTL Development Team

---

## 📝 Notes

### Sentry Client Configuration

**We intentionally use `instrumentation-client.ts` for client initialization** (no `sentry.client.config.ts` by design).

This follows Next.js 15.3+ conventions where `instrumentation-client.ts` is the recommended approach for client-side monitoring code that runs before the app becomes interactive. The file exports `onRouterTransitionStart` as required by `@sentry/nextjs` for navigation instrumentation.

**References:**
- [Next.js instrumentation-client documentation](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client)
- [Sentry Next.js navigation instrumentation](https://github.com/getsentry/sentry-javascript/issues/16815)

### Environment Variables

**Sentry DSNs:** All Sentry configs require DSN via environment variables (`SENTRY_DSN_PROD` or `SENTRY_DSN_DEV`). No hardcoded fallbacks - missing DSNs will disable Sentry with a warning (fail loudly, don't silently fail).

### Sentry Error Filtering Strategy

**ignoreErrors:** Only truly external/extension/known noise (minimal list).  
**beforeSend:** Runtime-specific suppression (dev-only HMR, EPIPE, etc.).

This separation prevents accidentally filtering real production bugs with broad regexes. Dev-only errors are filtered in `beforeSend` with environment checks, not in `ignoreErrors`.
