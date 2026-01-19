# Build and Audit Reference Documentation

This document consolidates the master build rules, audit scripts, and Sentry configuration files for the TOTL project.

---

## Table of Contents

1. [Master Build & Deployment Rules](#master-build--deployment-rules)
2. [Audit Script: Client Boundaries](#audit-script-client-boundaries)
3. [Audit Script: Single vs MaybeSingle](#audit-script-single-vs-maybesingle)
4. [Sentry Configuration Files](#sentry-configuration-files)
   - [Sentry Edge Config](#sentry-edge-config)
   - [Sentry Server Config](#sentry-server-config)
   - [Next.js Sentry Config](#nextjs-sentry-config)

---

## Master Build & Deployment Rules

**Source:** `docs/MASTER_BUILD_AND_DEPLOYMENT_RULES.md`

```markdown
# 🎯 Master Build & Deployment Rules

**Created:** January 2025  
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

**How we detect violations:** `npm run audit:client-boundaries` scans all files for browser client imports and checks for `"use client"` directive.

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

**How we detect violations:** `npm run guard:client-writes` scans for Supabase write operations in client components.

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
- `npm run guard:select-star` finds `select('*')` usage
- `npm run audit:single-vs-maybe-single` finds all `.single()` calls for human review

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

**Last Updated:** January 2025  
**Maintained By:** TOTL Development Team
```

---

## Audit Script: Client Boundaries

**Source:** `scripts/audit-client-boundaries.mjs`

```javascript
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git", "scripts"]);
const TARGET_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

const BROWSER_IMPORT_PATTERNS = [
  "@/lib/supabase/supabase-browser",
  "lib/supabase/supabase-browser",
  "@/lib/supabase-browser", // if you have legacy paths
  "lib/supabase-browser",
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    const ext = path.extname(entry.name);
    if (TARGET_EXT.has(ext)) out.push(path.join(dir, entry.name));
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function hasUseClient(src) {
  // Accept "use client"; or 'use client';
  return /^\s*["']use client["']\s*;?/m.test(src);
}

function importsBrowserSupabase(src) {
  return BROWSER_IMPORT_PATTERNS.some((p) => src.includes(p));
}

function isServerFile(filePath) {
  // Conservative: treat anything NOT use-client as server-capable.
  // That's the safe rule: browser imports require "use client".
  return true;
}

const files = walk(ROOT);
const violations = [];

for (const file of files) {
  const src = read(file);

  if (!importsBrowserSupabase(src)) continue;

  // Skip the browser file itself
  if (file.includes("supabase-browser.ts") || file.includes("supabase-browser.js")) continue;

  const useClient = hasUseClient(src);
  if (!useClient && isServerFile(file)) {
    violations.push(file);
  }
}

if (violations.length) {
  console.error("\n❌ Client Boundary Violations:");
  for (const v of violations) console.error(" -", path.relative(ROOT, v));
  console.error(
    "\nFix: add \"use client\" or move the import into a client-only module/hook.\n"
  );
  process.exit(1);
}

console.log("✅ audit-client-boundaries: no violations found");
```

---

## Audit Script: Single vs MaybeSingle

**Source:** `scripts/audit-single-vs-maybe-single.mjs`

```javascript
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git"]);
const TARGET_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    const ext = path.extname(entry.name);
    if (TARGET_EXT.has(ext)) out.push(path.join(dir, entry.name));
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

const files = walk(ROOT);
const hits = [];

for (const file of files) {
  const src = read(file);

  // basic heuristic
  if (!src.includes(".single(") && !src.includes(".single()")) continue;

  // ignore generated / known-safe patterns if you want:
  // if (file.includes("types/")) continue;

  const rel = path.relative(ROOT, file);
  const lines = src.split("\n");

  lines.forEach((line, i) => {
    if (line.includes(".single(") || line.includes(".single()")) {
      hits.push({ file: rel, line: i + 1, code: line.trim() });
    }
  });
}

if (hits.length) {
  console.warn("\n⚠️ .single() usages found (review required):\n");
  for (const h of hits) {
    console.warn(`${h.file}:${h.line}  ${h.code}`);
  }
  console.warn(
    "\nRule: use .single() only when the row is guaranteed to exist. Otherwise .maybeSingle().\n"
  );

  // You can decide whether to fail CI or not:
  // process.exit(1);
}

console.log("✅ audit-single-vs-maybe-single: completed");
```

---

## Sentry Configuration Files

### Sentry Edge Config

**Source:** `sentry.edge.config.ts`

```typescript
// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Determine which Sentry DSN to use based on environment
const isProduction = process.env.VERCEL_ENV === "production";

// Production DSN (from environment variable)
const PRODUCTION_DSN = process.env.SENTRY_DSN_PROD;

// Development DSN (fallback for local development)
// Using sentry-yellow-notebook DSN for all environments
const DEVELOPMENT_DSN = 
  process.env.SENTRY_DSN_DEV ||
  "https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609";

// Select the appropriate DSN
const SENTRY_DSN = isProduction && PRODUCTION_DSN 
  ? PRODUCTION_DSN 
  : DEVELOPMENT_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust sample rate based on environment
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set environment
  environment: process.env.VERCEL_ENV || "development",

  // Enable logs to be sent to Sentry (disabled in production to reduce noise)
  enableLogs: process.env.NODE_ENV !== "production",

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false, // Set to false for privacy in production

  // Ignore common errors
  ignoreErrors: [
    "NEXT_NOT_FOUND", 
    "NEXT_REDIRECT",
    "EPIPE", // Ignore broken pipe errors from stdout/dev server
    "write EPIPE", // Ignore write errors from dev server logging
  ],

  // Filter out non-critical system errors before sending to Sentry
  beforeSend(event, hint) {
    const error = hint.originalException;

    // SECURITY: Scrub sensitive data from event
    // Gold standard pattern: scrub headers, cookies, tokens, secrets, and large payloads
    const SENSITIVE_KEYS = ["authorization", "cookie", "set-cookie", "apikey", "token", "secret", "password"];

    const scrub = (obj: unknown): unknown => {
      if (!obj || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) return obj.map(scrub);

      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        const key = k.toLowerCase();
        if (SENSITIVE_KEYS.some((s) => key.includes(s))) out[k] = "[REDACTED]";
        else out[k] = scrub(v);
      }
      return out;
    };

    if (event?.request?.headers) event.request.headers = scrub(event.request.headers) as any;
    if (event?.request?.data) {
      // Scrub large payloads (common leak source)
      const dataStr = JSON.stringify(event.request.data);
      if (dataStr.length > 10000) {
        event.request.data = "[REDACTED - Large payload]";
      } else {
        event.request.data = scrub(event.request.data);
      }
    }
    if (event?.extra) event.extra = scrub(event.extra);
    if (event?.contexts) event.contexts = scrub(event.contexts);
    if (event?.user) event.user = scrub(event.user);

    // Filter out EPIPE errors (broken pipe from stdout/stderr)
    if (error && typeof error === 'object') {
      const errorObj = error as any;
      
      // Check for EPIPE system errors
      if (errorObj.code === 'EPIPE' || errorObj.errno === -32) {
        return null; // Don't send to Sentry
      }

      // Check for EPIPE in error message
      if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.includes('EPIPE')) {
        return null; // Don't send to Sentry
      }

      // Check for Next.js dev server logging errors (broader check)
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('log-requests.js') ||
                 frame.filename?.includes('build/output/log.js') ||
                 frame.filename?.includes('console-dev.js')
      )) {
        return null; // Don't send to Sentry - dev server logging issue
      }
    }

    return event;
  },
});
```

---

### Sentry Server Config

**Source:** `sentry.server.config.ts`

```typescript
// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
// import { SupabaseIntegration } from "@supabase/sentry-js-integration"; // Disabled - requires client instance at init
import {
  currentDSN,
  currentProjectId,
  developmentDSN,
  expectedProjectId,
  projectIdMatches,
  productionDSN,
  nodeEnv,
  serverIsProduction,
} from "@/lib/sentry/env";

const SENTRY_DSN = currentDSN;

// Log DSN status for debugging (only in development)
if (nodeEnv === "development") {
  console.log("[Sentry Server] Initializing with:", {
    isProduction: serverIsProduction,
    hasProductionDSN: !!productionDSN,
    hasDevelopmentDSN: !!developmentDSN,
    usingDSN: SENTRY_DSN ? "✅ Configured" : "❌ Missing",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    dsnPrefix: SENTRY_DSN ? SENTRY_DSN.substring(0, 30) + "..." : "N/A",
    projectId: currentProjectId || "Unknown",
    projectMatch: projectIdMatches ? "✅ Correct" : "❌ Wrong Project",
    expectedProjectId,
    nodeEnv,
  });

  if (SENTRY_DSN) {
    if (projectIdMatches) {
      console.log("[Sentry Server] ✅ Sentry is configured correctly for totlmodelagency");
    } else {
      console.warn(
        `[Sentry Server] ⚠️ Project ID mismatch! Using ${currentProjectId}, expected ${expectedProjectId}`
      );
      console.warn("[Sentry Server] ⚠️ Update your .env.local DSNs to point to the correct project");
    }
    console.log(
      "[Sentry Server] Test errors will appear at: https://sentry.io/organizations/the-digital-builders-bi/projects/totlmodelagency/"
    );
    console.log("[Sentry Server] Diagnostic endpoint: http://localhost:3000/api/sentry-diagnostic");
  } else {
    console.warn("[Sentry Server] ⚠️ Sentry DSN is missing - errors will not be tracked!");
  }
}

Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust sample rate based on environment
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set environment (matches guide pattern)
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development",

  // Enable logs to be sent to Sentry (enabled in development for better debugging)
  enableLogs: true,
  
  // Note: debug option requires debug bundle which isn't available in Next.js
  // Use console.log statements instead for debugging in development
  // debug: false, // Disabled to avoid "Cannot initialize SDK with debug option using a non-debug bundle" warning

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false, // Set to false for privacy in production

  // Integrations: Supabase - automatically instruments Supabase queries
  integrations: [
    // Note: SupabaseIntegration requires a client instance, which isn't available at init time
    // We'll instrument Supabase queries manually where needed
    // new SupabaseIntegration(), // Disabled - requires client instance
  ],

  // Ignore common errors
  ignoreErrors: [
    "NEXT_NOT_FOUND", 
    "NEXT_REDIRECT",
    "EPIPE", // Ignore broken pipe errors from stdout/dev server
    "write EPIPE", // Ignore write errors from dev server logging
    /write EPIPE/, // Regex pattern for write EPIPE errors
    /EPIPE.*write/, // Pattern for EPIPE write errors
    /Cannot read properties of undefined \(reading 'call'\)/, // Webpack HMR issues in dev
    /Cannot find module '\.\/\d+\.js'/, // Webpack chunk loading errors in dev
    /ENOENT.*\.next.*cache.*webpack/, // Webpack cache file errors in dev
    /no such file or directory.*\.next/, // .next folder missing file errors in dev
    "Cookies can only be modified in a Server Action or Route Handler", // Next.js 15 App Router cookies error
    /Cookies can only be modified in a Server Action or Route Handler/, // Regex pattern for cookies error
  ],

  // Filter out non-critical system errors before sending to Sentry
  beforeSend(event, hint) {
    const error = hint.originalException;

    // SECURITY: Scrub sensitive data from event
    // Gold standard pattern: scrub headers, cookies, tokens, secrets, and large payloads
    const SENSITIVE_KEYS = ["authorization", "cookie", "set-cookie", "apikey", "token", "secret", "password"];

    const scrub = (obj: unknown): unknown => {
      if (!obj || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) return obj.map(scrub);

      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        const key = k.toLowerCase();
        if (SENSITIVE_KEYS.some((s) => key.includes(s))) out[k] = "[REDACTED]";
        else out[k] = scrub(v);
      }
      return out;
    };

    if (event?.request?.headers) event.request.headers = scrub(event.request.headers) as any;
    if (event?.request?.data) {
      // Scrub large payloads (common leak source)
      const dataStr = JSON.stringify(event.request.data);
      if (dataStr.length > 10000) {
        event.request.data = "[REDACTED - Large payload]";
      } else {
        event.request.data = scrub(event.request.data);
      }
    }
    if (event?.extra) event.extra = scrub(event.extra);
    if (event?.contexts) event.contexts = scrub(event.contexts);
    if (event?.user) event.user = scrub(event.user);

    // Filter out EPIPE errors (broken pipe from stdout/stderr)
    if (error && typeof error === 'object') {
      const errorObj = error as any;
      
      // Check for EPIPE system errors
      if (errorObj.code === 'EPIPE' || errorObj.errno === -32) {
        return null; // Don't send to Sentry
      }

      // Check for EPIPE in error message
      if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.includes('EPIPE')) {
        return null; // Don't send to Sentry
      }

      // Check for Next.js dev server logging errors (broader check)
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('log-requests.js') ||
                 frame.filename?.includes('build/output/log.js') ||
                 frame.filename?.includes('console-dev.js') ||
                 frame.filename?.includes('next-dev-server.js') ||
                 frame.filename?.includes('dev/log-requests.js')
      )) {
        return null; // Don't send to Sentry - dev server logging issue
      }

      // Enhanced EPIPE filtering for development server logging
      if (process.env.NODE_ENV === 'development') {
        // Check if this is a write EPIPE error from Next.js dev server
        if (errorObj.message === 'write EPIPE' || 
            (errorObj.message && errorObj.message.includes('write EPIPE'))) {
          
          // Check if it's from Next.js dev server logging
          const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
          const isNextDevServerError = frames.some(
            frame => frame.filename?.includes('log-requests.js') ||
                     frame.filename?.includes('next-dev-server.js') ||
                     frame.filename?.includes('dev/log-requests.js') ||
                     frame.filename?.includes('next/dist/server/dev')
          );
          
          if (isNextDevServerError) {
            console.warn("Next.js dev server EPIPE error filtered - client disconnected during logging");
            return null; // Don't send to Sentry
          }
        }

        // Additional check for the specific error pattern from your Sentry report
        // This catches the exact error: "write EPIPE" from log-requests.js
        if (errorObj.message === 'write EPIPE' && 
            event.exception?.values?.[0]?.stacktrace?.frames?.some(
              frame => frame.filename?.includes('log-requests.js') && 
                       frame.function === 'writeLine'
            )) {
          console.warn("Next.js dev server writeLine EPIPE error filtered - client disconnected during request logging");
          return null; // Don't send to Sentry
        }
      }

      // Filter out webpack cache file errors (ENOENT) in development
      // These occur when .next folder is deleted while dev server is running
      if (errorObj.code === 'ENOENT' && errorObj.message?.includes('.next')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Webpack cache file missing - restart dev server to rebuild cache");
          return null; // Don't send to Sentry in development
        }
      }

      // Filter out webpack HMR/Fast Refresh errors in development
      // These are development-only issues that should be fixed by restarting dev server
      if (errorObj.message?.includes("Cannot read properties of undefined (reading 'call')") ||
          errorObj.message?.match(/Cannot find module '\.\/\d+\.js'/)) {
        // Check if it's from webpack module loading
        const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
        const isWebpackError = frames.some(
          frame => frame.filename?.includes('webpack') || 
                   frame.filename?.includes('bootstrap') ||
                   frame.filename?.includes('.next/server') ||
                   frame.module?.includes('webpack-runtime')
        );
        
        if (isWebpackError && process.env.NODE_ENV === 'development') {
          console.warn("Webpack HMR/chunk loading error detected - clear .next cache and restart dev server");
          return null; // Don't send to Sentry in development
        }
      }

      // Filter out Server Component prop errors in development only
      // In production, we want to know if these slip through
      if (errorObj.message?.includes('Event handlers cannot be passed to Client Component props')) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Server Component error in development - this should be fixed!");
          return null; // Filter in dev to reduce noise, but fix the code!
        }
        // In production, let it through so we know there's a problem
      }

      // Filter out Next.js 15 App Router cookies modification errors
      // This error occurs when trying to modify cookies in Server Components
      // instead of Server Actions or Route Handlers
      if (errorObj.message?.includes('Cookies can only be modified in a Server Action or Route Handler')) {
        console.warn("Next.js 15 App Router cookies error filtered - cookies should only be modified in Server Actions or Route Handlers");
        return null; // Don't send to Sentry - this is a code architecture issue
      }

      // Note: We intentionally DO let Server Component errors through in production
      // because they indicate real code issues that need to be fixed.
      // In development, we filter them to reduce noise since devs will see them in console.
    }

    return event;
  },
});
```

---

### Next.js Sentry Config

**Source:** `next.config.mjs` (Sentry-related section)

```javascript
import {withSentryConfig} from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config ...
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "the-digital-builders-bi",

  project: "totlmodelagency",

  // Sentry auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
```

---

## Notes

- **Sentry Config Files:** Only 2 dedicated Sentry config files were found (`sentry.edge.config.ts` and `sentry.server.config.ts`). The Sentry configuration in `next.config.mjs` is included as the third configuration reference.
- **Client Config:** No `sentry.client.config.ts` file was found. If needed, it should be created following the same pattern as the edge and server configs.

---

**Last Updated:** January 2025  
**Maintained By:** TOTL Development Team
