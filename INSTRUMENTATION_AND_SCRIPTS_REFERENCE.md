# Instrumentation and Scripts Reference Documentation

This document consolidates the client-side Sentry instrumentation configuration and all npm scripts for the TOTL project.

---

## Table of Contents

1. [Client-Side Sentry Instrumentation](#client-side-sentry-instrumentation)
2. [Package.json Scripts](#packagejson-scripts)

---

## Client-Side Sentry Instrumentation

**Source:** `instrumentation-client.ts`

```typescript
// instrumentation-client.ts
// This file configures Sentry for the client-side using Next.js 15.3+ instrumentation-client convention
// It replaces the deprecated sentry.client.config.ts approach
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from "@sentry/nextjs";
// import { SupabaseIntegration } from "@supabase/sentry-js-integration"; // Disabled - requires client instance at init
import {
  currentDSN,
  currentProjectId,
  developmentDSN,
  expectedProjectId,
  isProduction,
  nodeEnv,
  productionDSN,
  projectIdMatches,
} from "@/lib/sentry/env";

const SENTRY_DSN = currentDSN;

// Log DSN status for debugging (only in development)
if (nodeEnv === "development") {
  console.log("[Sentry Client] Initializing with:", {
    isProduction,
    hasProductionDSN: !!productionDSN,
    hasDevelopmentDSN: !!developmentDSN,
    usingDSN: SENTRY_DSN ? "✅ Configured" : "❌ Missing",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    dsnPrefix: SENTRY_DSN ? SENTRY_DSN.substring(0, 30) + "..." : "N/A",
    projectId: currentProjectId || "Unknown",
    projectMatch: projectIdMatches ? "✅ Correct" : "❌ Wrong Project",
    expectedProjectId,
    nodeEnv,
  });

  if (SENTRY_DSN) {
    if (projectIdMatches) {
      console.log("[Sentry Client] ✅ Sentry is configured correctly for totlmodelagency");
    } else {
      console.warn(
        `[Sentry Client] ⚠️ Project ID mismatch! Using ${currentProjectId}, expected ${expectedProjectId}`
      );
      console.warn("[Sentry Client] ⚠️ Update your .env.local DSNs to point to the correct project");
    }
    console.log(
      "[Sentry Client] Test errors will appear at: https://sentry.io/organizations/the-digital-builders-bi/projects/totlmodelagency/"
    );
  } else {
    console.warn("[Sentry Client] ⚠️ Sentry DSN is missing - errors will not be tracked!");
  }
}

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // Note: debug option requires debug bundle which isn't available in Next.js
  // Use console.log statements instead for debugging in development
  // debug: false, // Disabled to avoid "Cannot initialize SDK with debug option using a non-debug bundle" warning
  
  // Set environment (matches guide pattern)
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development",

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Integrations: Supabase + Session Replay
  integrations: [
    // Supabase integration - automatically instruments Supabase queries
    // Note: SupabaseIntegration requires a client instance, which isn't available at init time
    // We'll instrument Supabase queries manually where needed
    // new SupabaseIntegration(), // Disabled - requires client instance
    // Session Replay for debugging user sessions
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false, // Set to false for privacy in production

  // Ignore common errors
  ignoreErrors: [
    "NEXT_NOT_FOUND", 
    "NEXT_REDIRECT",
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    "fb_xd_fragment",
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    "conduitPage",
    // Firefox detection variables from browser extensions
    "__firefox__",
    /__firefox__/,
    /ReferenceError.*__firefox__/,
    /TypeError.*__firefox__/,
    /window\.__firefox__/,
    // Network errors that are often not actionable
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    // Development-only React Server Component errors
    /Event handlers cannot be passed to Client Component props/,
    // Webpack chunk loading errors in dev
    /Cannot find module '\.\/\d+\.js'/,
    /Cannot read properties of undefined \(reading 'call'\)/,
    // Webpack HMR module build errors (dev only)
    /Module build failed/,
    /Expected '<\//, // Matches "Expected '</'" and "Expected '</', got..."
    /Syntax Error/, // Webpack SWC loader syntax errors
    // Context provider HMR errors
    /must be used within an? \w+Provider/i, // "must be used within an AuthProvider", etc.
    // EPIPE errors from dev server (should be caught server-side, but just in case)
    "EPIPE",
    "write EPIPE",
    /write EPIPE/,
    // External script/browser extension errors
    "Particles is not defined",
    /Particles is not defined/,
    /ReferenceError.*Particles/,
    // Lucide React icon import errors
    "UserPlus is not defined",
    /UserPlus is not defined/,
    /ReferenceError.*UserPlus/,
    // Import path and module resolution errors
    "Invalid or unexpected token",
    /Invalid or unexpected token/,
    /SyntaxError.*Invalid or unexpected token/,
  ],

  // Filter out development-only errors before sending
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

      // Filter out hydration errors (often caused by browser extensions)
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        
        // Check for hydration errors
        if (errorObj.message?.includes("hydrat") || errorObj.message?.includes("hydration")) {
          console.warn("Hydration error filtered - often caused by browser extensions");
          return null; // Don't send to Sentry
        }
        
        // Filter EPIPE errors (should be caught server-side, but just in case)
        if (errorObj.message === 'write EPIPE' || 
            errorObj.message?.includes('EPIPE') ||
            errorObj.code === 'EPIPE' ||
            errorObj.errno === -32) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("EPIPE error filtered - development server logging issue");
            return null; // Filter in dev
          }
        }

      // Filter Particles ReferenceError (likely from browser extensions or external scripts)
      if (errorObj.message === 'Particles is not defined' ||
          errorObj.message?.includes('Particles is not defined') ||
          (errorObj.name === 'ReferenceError' && errorObj.message?.includes('Particles'))) {
        console.warn("Particles ReferenceError filtered - likely from browser extension, Electron environment, or external script");
        return null; // Filter this error
      }

      // Filter UserPlus ReferenceError (Lucide React icon import issue)
      if (errorObj.message === 'UserPlus is not defined' ||
          errorObj.message?.includes('UserPlus is not defined') ||
          (errorObj.name === 'ReferenceError' && errorObj.message?.includes('UserPlus'))) {
        console.warn("UserPlus ReferenceError filtered - Lucide React icon import issue");
        return null; // Filter this error
      }

      // Filter SyntaxError for invalid tokens (import path issues)
      if (errorObj.message === 'Invalid or unexpected token' ||
          errorObj.message?.includes('Invalid or unexpected token') ||
          (errorObj.name === 'SyntaxError' && errorObj.message?.includes('Invalid or unexpected token'))) {
        console.warn("SyntaxError filtered - Invalid or unexpected token (likely import path issue)");
        return null; // Filter this error
      }

      // Additional check for Electron-specific errors
      if (typeof window !== 'undefined' && 
          (window as any).navigator?.userAgent?.includes('Electron') &&
          errorObj.name === 'ReferenceError' && 
          errorObj.message?.includes('is not defined')) {
        console.warn("Electron ReferenceError filtered - likely from Electron environment or external script");
        return null; // Filter this error
      }

      // Filter Firefox detection variable errors (often from browser extensions)
      if (errorObj.message === "Can't find variable: __firefox__" ||
          errorObj.message?.includes('__firefox__') ||
          errorObj.message?.includes('window.__firefox__') ||
          (errorObj.name === 'ReferenceError' && errorObj.message?.includes('__firefox__')) ||
          (errorObj.name === 'TypeError' && errorObj.message?.includes('__firefox__'))) {
        console.warn("__firefox__ error filtered - likely from browser extension or external script");
        return null; // Filter this error
      }
      
      // Server Component prop serialization errors
      if (errorObj.message?.includes('Event handlers cannot be passed to Client Component props')) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Server Component error in development - this should be fixed!");
          return null; // Filter in dev to reduce noise, but fix the code!
        }
        // In production, let it through so we know there's a problem
      }
      
      // Filter out network errors that are often not actionable
      if (errorObj.message?.includes("Network request failed") ||
          errorObj.message?.includes("NetworkError") ||
          errorObj.message?.includes("Failed to fetch")) {
        // Check if it's a real network error or just a browser extension issue
        const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
        const isBrowserExtensionError = frames.some(
          frame => frame.filename?.includes('extension://') ||
                   frame.filename?.includes('moz-extension://') ||
                   frame.filename?.includes('safari-extension://')
        );
        
        if (isBrowserExtensionError) {
          console.warn("Network error from browser extension filtered");
          return null; // Don't send to Sentry
        }
      }

      // Webpack chunk loading errors
      if (errorObj.message?.match(/Cannot find module '\.\/\d+\.js'/)) {
        const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
        const isWebpackError = frames.some(
          frame => frame.filename?.includes('webpack') || 
                   frame.filename?.includes('chunk') ||
                   frame.filename?.includes('_next/static')
        );
        
        if (isWebpackError && process.env.NODE_ENV === 'development') {
          console.warn("Webpack chunk loading error filtered - development HMR issue");
          return null; // Filter in dev
        }
      }

      // Webpack HMR module build errors
      if (errorObj.message?.includes('Module build failed') ||
          errorObj.message?.match(/Expected '<\//) ||
          errorObj.message?.includes('Syntax Error')) {
        const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
        const isWebpackError = frames.some(
          frame => frame.filename?.includes('webpack') || 
                   frame.filename?.includes('loader') ||
                   frame.filename?.includes('swc')
        );
        
        if (isWebpackError && process.env.NODE_ENV === 'development') {
          console.warn("Webpack build error filtered - development HMR issue");
          return null; // Filter in dev
        }
      }

      // Context provider HMR errors
      if (errorObj.message?.match(/must be used within an? \w+Provider/i)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Context provider error filtered - development HMR issue");
          return null; // Filter in dev
        }
      }
    }

    return event;
  },
});

// Export onRouterTransitionStart hook for Sentry navigation instrumentation
// This is required by @sentry/nextjs to instrument Next.js router transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

---

## Package.json Scripts

**Source:** `package.json` (scripts section)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "lint:build": "npm run lint && npm run build",
    "import-order:fix": "powershell -ExecutionPolicy Bypass -File scripts/fix-import-order.ps1",
    "format": "prettier --write .",
    "prepare": "husky install",
    "verify-schema": "bash scripts/verify-schema-truth.sh",
    "types:regen": "cmd /d /c \"set SUPABASE_INTERNAL_NO_DOTENV=1&& npx -y supabase@2.34.3 gen types typescript --project-id utvircuwknqzpnmvxidp --schema public > types\\database.ts && node scripts\\prepend-autogen-banner.mjs\"",
    "types:regen:dev": "cmd /d /c \"set SUPABASE_INTERNAL_NO_DOTENV=1&& npx -y supabase@2.34.3 gen types typescript --project-id utvircuwknqzpnmvxidp --schema public > types\\database.ts && node scripts\\prepend-autogen-banner.mjs\"",
    "types:regen:prod": "if not defined SUPABASE_PROJECT_ID (echo SUPABASE_PROJECT_ID env var is required for prod regen && exit /b 1) else cmd /d /c \"set SUPABASE_INTERNAL_NO_DOTENV=1&& npx -y supabase@2.34.3 gen types typescript --project-id %SUPABASE_PROJECT_ID% --schema public > types\\database.ts && node scripts\\prepend-autogen-banner.mjs\"",
    "types:check": "node scripts/verify-types-fresh.mjs",
    "schema:verify-local": "node scripts/verify-schema-local.mjs",
    "schema:check": "node scripts/quick-schema-check.mjs",
    "schema:verify-fast": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-schema-sync.ps1 -SkipDbGeneration",
    "supabase:login": "npx -y supabase@2.34.3 login",
    "supabase:link": "npx -y supabase@2.34.3 link --project-ref %SUPABASE_PROJECT_ID%",
    "link:dev": "npx -y supabase@2.34.3 link --project-ref utvircuwknqzpnmvxidp",
    "link:prod": "if not defined SUPABASE_PROJECT_ID (echo SUPABASE_PROJECT_ID env var is required for prod linking && exit /b 1) else npx -y supabase@2.34.3 link --project-ref %SUPABASE_PROJECT_ID%",
    "schema:verify": "powershell -ExecutionPolicy Bypass -File scripts/verify-schema-sync.ps1",
    "schema:verify:comprehensive": "node scripts/verify-schema-sync-comprehensive.mjs",
    "schema:verify:linked": "cmd /d /c \"set REQUIRE_SUPABASE_LINK=1&& node scripts\\verify-schema-sync-comprehensive.mjs\"",
    "async-cookies:check": "powershell -ExecutionPolicy Bypass -File scripts/fix-async-cookies.ps1",
    "security:check": "powershell -ExecutionPolicy Bypass -File scripts/security-standards-check.ps1",
    "type-safety:check": "powershell -ExecutionPolicy Bypass -File scripts/check-type-safety-comprehensive.ps1",
    "type-safety:check:verbose": "powershell -ExecutionPolicy Bypass -File scripts/check-type-safety-comprehensive.ps1 -Verbose",
    "pre-commit": "powershell -ExecutionPolicy Bypass -File scripts/pre-commit-checks.ps1",
    "pre-commit:legacy": "npm run schema:verify:comprehensive && npm run lint && tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "db:reset": "supabase db reset --yes",
    "db:push": "supabase db push --linked",
    "db:pull": "supabase db pull",
    "db:status": "supabase db status --linked",
    "db:new": "supabase migration new",
    "db:setup": "powershell -ExecutionPolicy Bypass -File scripts/setup-supabase.ps1",
    "guard:select-star": "node scripts/guard-no-select-star.mjs",
    "guard:client-writes": "node scripts/guard-no-client-writes.mjs",
    "guard:import-paths": "node scripts/guard-import-paths.mjs",
    "guard:no-npm-run-in-code": "node scripts/guard-no-npm-run-in-code.mjs",
    "verify-fast": "npm run guard:select-star && npm run guard:client-writes && npm run guard:import-paths && npm run guard:no-npm-run-in-code && npm run types:check && npm run typecheck && npm run lint",
    "verify-all": "npm run guard:select-star && npm run guard:client-writes && npm run guard:import-paths && npm run guard:no-npm-run-in-code && npm run rls:guard && npm run schema:verify:comprehensive && npm run types:check && npm run type-safety:check && npm run security:check && npm run typecheck && npm run lint && npm run build",
    "dod": "npx tsc --noEmit && npx eslint . --ext .ts,.tsx --max-warnings 0",
    "env:setup": "bash scripts/setup-env.sh",
    "env:check": "node scripts/check-env.mjs",
    "env:verify": "node scripts/verify-env.mjs",
    "env:test": "node scripts/test-env.js",
    "test:unit": "vitest run --config vitest.config.ts",
    "status:auto": "git add MVP_STATUS_NOTION.md && git commit -m 'docs: update MVP status (auto)' || exit 0",
    "status:update": "powershell -ExecutionPolicy Bypass -File scripts/update-mvp-status.ps1",
    "rls:guard": "node scripts/check-rls-policy-recursion.mjs",
    "audit:client-boundaries": "node scripts/audit-client-boundaries.mjs",
    "audit:single-vs-maybe-single": "node scripts/audit-single-vs-maybe-single.mjs",
    "audit:all": "node scripts/audit-all.mjs",
    "audit:quick": "powershell -ExecutionPolicy Bypass -File scripts/quick-sanity-grep.ps1",
    "pre-push:check": "npm run schema:verify:comprehensive && npm run types:check && npm run build && npm run lint && npm run audit:all"
  }
}
```

---

## Script Categories Reference

### Development
- `dev` - Start Next.js development server
- `build` - Build Next.js application for production
- `start` - Start Next.js production server
- `test:unit` - Run unit tests with Vitest

### Code Quality
- `lint` - Run ESLint
- `lint:fix` - Run ESLint with auto-fix
- `lint:build` - Run lint then build
- `format` - Format code with Prettier
- `typecheck` - Run TypeScript type checking
- `import-order:fix` - Fix import order issues

### Type Management
- `types:regen` - Regenerate TypeScript types from Supabase schema (dev)
- `types:regen:dev` - Regenerate types for dev project
- `types:regen:prod` - Regenerate types for production project
- `types:check` - Verify types are fresh

### Schema Management
- `schema:verify-local` - Verify schema locally
- `schema:check` - Quick schema check
- `schema:verify-fast` - Fast schema verification (skip DB generation)
- `schema:verify` - Full schema verification
- `schema:verify:comprehensive` - Comprehensive schema verification
- `schema:verify:linked` - Schema verification with Supabase link requirement
- `verify-schema` - Verify schema truth

### Supabase CLI
- `supabase:login` - Login to Supabase CLI
- `supabase:link` - Link to Supabase project
- `link:dev` - Link to dev project
- `link:prod` - Link to production project

### Database Operations
- `db:reset` - Reset local database
- `db:push` - Push migrations to linked database
- `db:pull` - Pull schema from database
- `db:status` - Check database migration status
- `db:new` - Create new migration
- `db:setup` - Setup Supabase locally

### Guards & Audits
- `guard:select-star` - Guard against `select('*')` usage
- `guard:client-writes` - Guard against client-side DB writes
- `guard:import-paths` - Guard against incorrect import paths
- `guard:no-npm-run-in-code` - Guard against npm run in code
- `audit:client-boundaries` - Audit client/server boundaries
- `audit:single-vs-maybe-single` - Audit `.single()` vs `.maybeSingle()` usage
- `audit:all` - Run all audit scripts
- `audit:quick` - Quick sanity grep audit
- `rls:guard` - Guard RLS policy recursion

### Verification & Testing
- `verify-fast` - Fast verification (guards + types + lint)
- `verify-all` - Full verification (all checks + build)
- `dod` - Definition of Done check
- `pre-commit` - Pre-commit hook checks
- `pre-commit:legacy` - Legacy pre-commit checks

### Environment
- `env:setup` - Setup environment variables
- `env:check` - Check environment variables
- `env:verify` - Verify environment variables
- `env:test` - Test environment configuration

### Security & Standards
- `security:check` - Security standards check
- `type-safety:check` - Type safety comprehensive check
- `type-safety:check:verbose` - Verbose type safety check
- `async-cookies:check` - Check async cookies usage

### Status & Documentation
- `status:auto` - Auto-update MVP status
- `status:update` - Update MVP status manually

### Pre-Push
- `pre-push:check` - Run checks before pushing (schema + types + build + lint + audits)

### Git Hooks
- `prepare` - Install Husky git hooks

---

## Common Workflows

### Before Committing
```bash
npm run pre-commit
```

### Before Pushing
```bash
npm run pre-push:check
```

### Quick Verification
```bash
npm run verify-fast
```

### Full Verification
```bash
npm run verify-all
```

### Regenerate Types (Dev)
```bash
npm run types:regen:dev
```

### Regenerate Types (Prod)
```bash
npm run types:regen:prod
```

### Run All Audits
```bash
npm run audit:all
```

---

**Last Updated:** January 2025  
**Maintained By:** TOTL Development Team
