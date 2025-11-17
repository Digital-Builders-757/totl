// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
// import { SupabaseIntegration } from "@supabase/sentry-js-integration"; // Disabled - requires client instance at init

// Determine which Sentry DSN to use based on environment
// Note: In client-side code, we can only access NEXT_PUBLIC_* env vars
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production" || 
                     process.env.NODE_ENV === "production";

// Production DSN (from environment variable)
const PRODUCTION_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN_PROD || 
                       process.env.NEXT_PUBLIC_SENTRY_DSN;

// Development DSN (fallback for local development)
// Using sentry-yellow-notebook DSN for all environments
const DEVELOPMENT_DSN = 
  process.env.NEXT_PUBLIC_SENTRY_DSN_DEV ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609";

// Select the appropriate DSN
const SENTRY_DSN = isProduction && PRODUCTION_DSN 
  ? PRODUCTION_DSN 
  : DEVELOPMENT_DSN;

// Log DSN status for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("[Sentry Client] Initializing with:", {
    isProduction,
    hasProductionDSN: !!PRODUCTION_DSN,
    hasDevelopmentDSN: !!DEVELOPMENT_DSN,
    usingDSN: SENTRY_DSN ? "✅ Configured" : "❌ Missing",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  });
}

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set environment (matches guide pattern)
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
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
    // Browser extension errors
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    "fb_xd_fragment",
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    "conduitPage",
    // Network errors that are often not actionable
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    // Webpack chunk loading errors in development
    /Cannot find module '\.\/\d+\.js'/,
    /Cannot read properties of undefined \(reading 'call'\)/,
    // Server Component prop errors
    /Event handlers cannot be passed to Client Component props/,
  ],

  // Filter out non-critical system errors before sending to Sentry
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Filter out hydration errors (often caused by browser extensions)
    if (error && typeof error === 'object') {
      const errorObj = error as any;
      
      // Check for hydration errors
      if (errorObj.message?.includes("hydrat") || errorObj.message?.includes("hydration")) {
        console.warn("Hydration error filtered - often caused by browser extensions");
        return null; // Don't send to Sentry
      }

      // Filter out Server Component errors in development only
      // In production, we want to know if these slip through
      if (errorObj.message?.includes('Event handlers cannot be passed to Client Component props')) {
        if (process.env.NODE_ENV === "development") {
          console.error("Server Component error in development - this should be fixed!");
          return null; // Filter in dev to reduce noise, but fix the code!
        }
        // In production, let it through so we know there's a problem
      }

      // Filter out webpack chunk loading errors in development
      // These are development-only issues that should be fixed by restarting dev server
      if (errorObj.message?.includes("Cannot read properties of undefined (reading 'call')") ||
          errorObj.message?.match(/Cannot find module '\.\/\d+\.js'/)) {
        // Check if it's from webpack module loading
        const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
        const isWebpackError = frames.some(
          frame => frame.filename?.includes('webpack') || 
                   frame.filename?.includes('bootstrap') ||
                   frame.filename?.includes('.next/client') ||
                   frame.module?.includes('webpack-runtime')
        );
        
        if (isWebpackError && process.env.NODE_ENV === "development") {
          console.warn("Webpack HMR/chunk loading error detected - clear .next cache and restart dev server");
          return null; // Don't send to Sentry in development
        }
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
    }

    return event;
  },
});

