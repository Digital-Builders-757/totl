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
import { scrubEvent } from "@/lib/sentry/scrub";

const SENTRY_DSN = currentDSN;

// Fail loudly if DSN is missing (no silent failures)
if (!SENTRY_DSN) {
  console.warn(
    "[Sentry Client] ⚠️ SENTRY_DSN is missing - Sentry will be disabled. Set SENTRY_DSN_PROD or SENTRY_DSN_DEV in environment variables."
  );
}

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
  dsn: SENTRY_DSN ?? undefined,
  
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

  // Replay sampling: lower in production to control costs and risk surface
  // Dev: 100% of errors get replays (helpful for debugging)
  // Prod: 5% of errors get replays (cost-effective, still captures critical issues)
  replaysOnErrorSampleRate: isProduction ? 0.05 : 1.0,

  // Session replay sampling:
  // Prod: disabled (capture mostly on error); Dev: 10% for local debugging
  replaysSessionSampleRate: isProduction ? 0.0 : 0.1,

  // Integrations: Supabase + Session Replay + Browser Tracing (Web Vitals)
  integrations: [
    // Browser Tracing integration - enables Web Vitals (LCP, INP, CLS) and performance monitoring
    Sentry.browserTracingIntegration({
      // Enable Web Vitals tracking
      enableInp: true,
      enableLongTask: true,
    }),
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
  // Keep this list minimal: only truly external/extension/known noise
  // Dev-only errors should be filtered in beforeSend, not here (to avoid filtering real prod issues)
  ignoreErrors: [
    "NEXT_NOT_FOUND", 
    "NEXT_REDIRECT",
    // Browser extensions (truly external, never actionable)
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
    // External script/browser extension errors (truly external)
    "Particles is not defined",
    /Particles is not defined/,
    /ReferenceError.*Particles/,
    // Lucide React icon import errors (known external issue)
    "UserPlus is not defined",
    /UserPlus is not defined/,
    /ReferenceError.*UserPlus/,
    // Note: Dev-only errors (webpack, HMR, etc.) are filtered in beforeSend
    // to avoid accidentally filtering real production issues with broad regexes
  ],

  // Filter out development-only errors before sending
  beforeSend(event, hint) {
    const error = hint.originalException;

    // SECURITY: Scrub sensitive data from event (shared utility)
    event = scrubEvent(event);

    // Filter non-actionable Safari/network noise:
    // Some browsers surface transient fetch failures as a bare "TypeError: Load failed" with no stack.
    // Only suppress when handled=yes and we have no stack frames.
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "";

    // Instagram Android WebView + Sentry Replay flake (not actionable, not app code).
    if (errorMessage.includes("enableDidUserTypeOnKeyboardLogging")) {
      return null;
    }

    if (errorMessage && errorMessage.includes("Load failed")) {
      const hasStack = Boolean(
        event.exception?.values?.[0]?.stacktrace?.frames &&
          event.exception.values[0].stacktrace.frames.length
      );

      const isHandled = event.tags?.handled === "yes";

      if (isHandled && !hasStack) {
        return null;
      }
    }

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

      // Filter Supabase auth-js lock AbortError during navigation (expected)
      if (errorObj.name === "AbortError" && errorObj.message?.includes("signal is aborted without reason")) {
        const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
        const isSupabaseLockAbort = frames.some(
          (frame) => frame.filename?.includes("@supabase/auth-js") && frame.filename?.includes("locks")
        );

        if (isSupabaseLockAbort) {
          Sentry.addBreadcrumb({
            category: "auth.bootstrap",
            message: "supabase_lock_abort_filtered",
            level: "info",
            data: {
              errorName: errorObj.name,
              errorMessage: errorObj.message,
            },
          });
          console.warn("Supabase auth lock AbortError filtered - expected during navigation");
          return null;
        }
      }

      // Filter UserPlus ReferenceError (Lucide React icon import issue)
      if (errorObj.message === 'UserPlus is not defined' ||
          errorObj.message?.includes('UserPlus is not defined') ||
          (errorObj.name === 'ReferenceError' && errorObj.message?.includes('UserPlus'))) {
        console.warn("UserPlus ReferenceError filtered - Lucide React icon import issue");
        return null; // Filter this error
      }

      // Filter SyntaxError for invalid tokens (import path issues) - DEV ONLY
      // In production, this could be a real issue, so only filter in dev
      if (errorObj.message === 'Invalid or unexpected token' ||
          errorObj.message?.includes('Invalid or unexpected token') ||
          (errorObj.name === 'SyntaxError' && errorObj.message?.includes('Invalid or unexpected token'))) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("SyntaxError filtered - Invalid or unexpected token (likely import path issue)");
          return null; // Filter in dev only
        }
        // In production, let it through - could be a real issue
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

      // AbortError from Supabase auth-js locks during navigation (expected cancellation)
      // Only filter if it's from the locks.js file to avoid suppressing unrelated aborts
      if (errorObj.name === 'AbortError' && 
          (errorObj.message === 'signal is aborted without reason' ||
           errorObj.message?.includes('signal is aborted'))) {
        const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
        const isAuthLockError = frames.some(
          frame => frame.filename?.includes('auth-js') && 
                   frame.filename?.includes('locks')
        );
        
        if (isAuthLockError) {
          console.log("AbortError from Supabase auth locks filtered - expected during navigation/unmount");
          return null; // Don't send to Sentry - this is expected behavior
        }
      }

      // Filter AuthSessionMissingError when it's expected (guest mode on public pages)
      // This prevents Sentry noise from bootstrap treating guest mode as an exception
      // IMPORTANT: Only filter when breadcrumbs prove it's guest mode, not real auth failures
      const isAuthSessionMissing = 
        errorObj.name === 'AuthSessionMissingError' ||
        (errorObj.message?.includes('session') && 
         (errorObj.message?.includes('missing') || 
          errorObj.message?.includes('not found') || 
          errorObj.message?.includes('invalid')) &&
         // Ensure it's not a different error that mentions "session" (e.g., "session expired")
         !errorObj.message?.includes('expired') &&
         !errorObj.message?.includes('refresh'));

      if (isAuthSessionMissing) {
        // Check breadcrumbs to see if this happened during INITIAL_SESSION with no session
        const breadcrumbs = event.breadcrumbs || [];
        const hasInitialSessionNoSession = breadcrumbs.some(
          (b) =>
            b.category === "auth.bootstrap" &&
            (b.message === "auth.onAuthStateChange.INITIAL_SESSION" ||
             b.data?.event === "INITIAL_SESSION") &&
            b.data?.hasSession === false
        );

        // Also check for no_session_exit breadcrumb (our new gate)
        // Use isProtectedPath: false to ensure it's a public page
        const hasNoSessionExitPublic = breadcrumbs.some(
          (b) =>
            b.category === "auth.bootstrap" &&
            b.data?.phase === "no_session_exit" &&
            b.data?.isProtectedPath === false
        );

        // Also check for no_session_expected breadcrumb (getUser() caught AuthSessionMissingError)
        const hasNoSessionExpected = breadcrumbs.some(
          (b) =>
            b.category === "auth.bootstrap" &&
            b.data?.phase === "no_session_expected" &&
            b.data?.isProtectedPath === false
        );

        // Filter if it's clearly guest mode (INITIAL_SESSION with no session OR no_session_exit/no_session_expected on public path)
        // DO NOT filter if isProtectedPath is true - those are real auth failures
        if (hasInitialSessionNoSession || hasNoSessionExitPublic || hasNoSessionExpected) {
          console.log("AuthSessionMissingError filtered - expected guest mode on public page");
          return null; // Don't send to Sentry - this is expected behavior
        }
        
        // If we can't prove it's guest mode, let it through (better to over-report than hide real issues)
      }
    }

    return event;
  },
});

// Export onRouterTransitionStart hook for Sentry navigation instrumentation
// This is required by @sentry/nextjs to instrument Next.js router transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

