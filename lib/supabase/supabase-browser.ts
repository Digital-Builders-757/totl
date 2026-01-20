// lib/supabase-browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let client: SupabaseClient<Database> | null = null;
let isInitializing = false;
let sentryBreadcrumbSent = false;

/**
 * Reset the browser client singleton (useful for sign out)
 */
export function resetSupabaseBrowserClient() {
  client = null;
  isInitializing = false;
  // Reset Sentry breadcrumb flag on reset (allows re-init after sign out)
  sentryBreadcrumbSent = false;
}

/**
 * Creates a Supabase browser client with proper error handling.
 * 
 * Uses `createBrowserClient` from `@supabase/ssr` for cookie-based session persistence.
 * This ensures the server/middleware can read the session (unlike localStorage-based clients).
 * 
 * **HARDENING**: Always throws if env vars are missing (no null returns).
 * If env vars are missing, you want a hard crash—not a zombie dashboard.
 * 
 * **CRITICAL**: This function must ONLY be called after component mount:
 * - Inside `useEffect(() => { ... }, [])`
 * - Inside `useLayoutEffect(() => { ... }, [])`
 * - Inside event handlers (async functions, arrow functions)
 * 
 * **NEVER** call this during render (component body, module scope, memo initializers).
 * Client Components may render on the server for initial HTML (RSC pipeline),
 * and `window` will be undefined during SSR/RSC render.
 * 
 * @throws {Error} If NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing
 * @throws {Error} If called during SSR/RSC render (when `window === undefined`)
 * @returns {SupabaseClient<Database>} Client instance (never null)
 */
export function createSupabaseBrowser(): SupabaseClient<Database> {
  // Only create client on client-side
  if (typeof window === 'undefined') {
    throw new Error("createSupabaseBrowser() can only be called in the browser. Call it in useEffect, useLayoutEffect, or event handlers, never during render.");
  }

  // Return existing client if already created (atomic singleton check)
  if (client) return client;

  // Guard against concurrent initialization (React Strict Mode double-mount protection)
  // In practice, JavaScript is single-threaded, but this provides extra safety
  if (isInitializing) {
    // This shouldn't happen in normal execution, but if it does, wait briefly and retry
    // In practice, since createClient is synchronous, this is just a safety net
    let retries = 0;
    while (isInitializing && retries < 10) {
      // Busy wait (synchronous) - should resolve immediately since createClient is sync
      // This is a fallback for edge cases
      retries++;
    }
    if (client) return client;
  }

  // Mark initialization in progress
  isInitializing = true;

  try {
    // Check if environment variables are available
    // NOTE: NEXT_PUBLIC_* vars are inlined at BUILD TIME, not runtime
    // If missing during build, bundle contains `undefined` until redeploy
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const errorMessage = 
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in client bundle. " +
        "Verify Vercel Production environment variables exist, then redeploy with cache cleared.";

      // HARDENING: Always throw - no null returns, even in dev
      // If env vars are missing, you want a hard crash—not a zombie dashboard
      console.error("[Supabase Client] Fatal error:", errorMessage);
      throw new Error(errorMessage);
    }

    // Truth beacon: Log env presence (always, for production debugging)
    const envPresent = {
      url: !!supabaseUrl,
      anonKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      anonKeyLength: supabaseAnonKey?.length || 0,
    };

    // Log to console (dev only) - use host only to avoid data leakage
    if (process.env.NODE_ENV === "development") {
      try {
        const urlHost = new URL(supabaseUrl).host;
        console.log("[Supabase Client] Initializing browser client", {
          urlHost,
          hasAnonKey: envPresent.anonKey,
          anonKeyLength: envPresent.anonKeyLength,
          envPresent: envPresent.url && envPresent.anonKey,
        });
      } catch {
        // URL parsing failed, log minimal info
        console.log("[Supabase Client] Initializing browser client", {
          hasUrl: envPresent.url,
          hasAnonKey: envPresent.anonKey,
          envPresent: envPresent.url && envPresent.anonKey,
        });
      }
    }

    // HARDENING: Send env presence to Sentry as breadcrumb (production only, once)
    // Gate to production + use flag to prevent multiple breadcrumbs on re-init cycles
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== 'undefined' &&
      !sentryBreadcrumbSent
    ) {
      sentryBreadcrumbSent = true;
      // Dynamic import to avoid SSR issues and reduce bundle size
      import("@sentry/nextjs")
        .then((Sentry) => {
          Sentry.addBreadcrumb({
            category: "supabase.client.init",
            message: "Supabase browser client initialization",
            level: envPresent.url && envPresent.anonKey ? "info" : "error",
            data: {
              env_present: envPresent.url && envPresent.anonKey,
              has_url: envPresent.url,
              has_anon_key: envPresent.anonKey,
              url_length: envPresent.urlLength,
              anon_key_length: envPresent.anonKeyLength,
              release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "unknown",
            },
          });

          // Set as tag for easy filtering in Sentry
          Sentry.setTag(
            "supabase_env_present",
            envPresent.url && envPresent.anonKey ? "true" : "false"
          );
        })
        .catch(() => {
          // Sentry not available, skip silently
          // Reset flag on failure to allow retry on next init
          sentryBreadcrumbSent = false;
        });
    }

    // ✅ cookie-based browser client (server/middleware can see session)
    // This ensures middleware can read the session via cookies, not just localStorage
    // @ts-expect-error - Type compatibility quirk between @supabase/ssr and @supabase/supabase-js versions
    // Runtime behavior is correct - createBrowserClient returns a fully compatible SupabaseClient
    // In some package versions, this cast may not be needed, but it's safe to include
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }) as SupabaseClient<Database>;

    return client;
  } finally {
    // Always clear initialization flag
    isInitializing = false;
  }
}
