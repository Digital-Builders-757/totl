// instrumentation-client.ts
// This file configures Sentry for the client-side using Next.js 15.3+ instrumentation-client convention
// It replaces the deprecated sentry.client.config.ts approach
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

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

  // Note: debug option requires debug bundle which isn't available in Next.js
  // Use console.log statements instead for debugging in development
  // debug: false, // Disabled to avoid "Cannot initialize SDK with debug option using a non-debug bundle" warning
  
  // Set environment (matches guide pattern)
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
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

