// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Determine which Sentry DSN to use based on environment
const isProduction = process.env.VERCEL_ENV === "production";

// Production DSN (from environment variable)
const PRODUCTION_DSN = process.env.SENTRY_DSN_PROD;

// Development DSN (fallback for local development)
const DEVELOPMENT_DSN = 
  process.env.SENTRY_DSN_DEV ||
  "https://3b65d7c0706cdd0196906fa0d45c0731@o4510190992424960.ingest.us.sentry.io/4510191032926215";

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

  // Enable logs to be sent to Sentry (enabled in development for better debugging)
  enableLogs: true,
  
  // Set debug mode to see what's happening
  debug: process.env.NODE_ENV === "development",

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false, // Set to false for privacy in production

  // Ignore common errors
  ignoreErrors: [
    "NEXT_NOT_FOUND", 
    "NEXT_REDIRECT",
    "EPIPE", // Ignore broken pipe errors from stdout/dev server
    "write EPIPE", // Ignore write errors from dev server logging
    /Cannot read properties of undefined \(reading 'call'\)/, // Webpack HMR issues in dev
    /Cannot find module '\.\/\d+\.js'/, // Webpack chunk loading errors in dev
  ],

  // Filter out non-critical system errors before sending to Sentry
  beforeSend(event, hint) {
    const error = hint.originalException;

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

      // Note: We intentionally DO let Server Component errors through in production
      // because they indicate real code issues that need to be fixed.
      // In development, we filter them to reduce noise since devs will see them in console.
    }

    return event;
  },
});
