// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Extend Window interface for Sentry initialization flag
declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
  }
}

// Determine which Sentry DSN to use based on environment
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

// Production DSN (from environment variable)
const PRODUCTION_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN_PROD;

// Development DSN (fallback for local development)
const DEVELOPMENT_DSN = 
  process.env.NEXT_PUBLIC_SENTRY_DSN_DEV ||
  "https://3b65d7c0706cdd0196906fa0d45c0731@o4510190992424960.ingest.us.sentry.io/4510191032926215";

// Select the appropriate DSN
const SENTRY_DSN = isProduction && PRODUCTION_DSN 
  ? PRODUCTION_DSN 
  : DEVELOPMENT_DSN;

// Prevent multiple initialization
if (typeof window !== "undefined" && !window.__SENTRY_INITIALIZED__) {
  window.__SENTRY_INITIALIZED__ = true;

  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust sample rate based on environment
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Set environment
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === "development",

    // Replay settings - enabled in development for better debugging
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.5, // 50% in dev, 10% in prod

    // Enable Replay integration for session recordings
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false, // Show text in development for better debugging
        blockAllMedia: false, // Show media in development
      }),
    ],

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: false, // Set to false for privacy in production

    // Ignore common errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random network errors
      "Network request failed",
      "NetworkError",
      // Development-only React Server Component errors
      /Event handlers cannot be passed to Client Component props/,
      // Webpack chunk loading errors in dev
      /Cannot find module '\.\/\d+\.js'/,
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
    ],

    // Filter out development-only errors before sending
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter React Server Component errors in development
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        
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
        
        // Server Component prop serialization errors
        if (errorObj.message?.includes('Event handlers cannot be passed to Client Component props')) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Client-side Server Component error - this should be fixed!");
            return null; // Filter in dev
          }
          // In production, let it through so we know there's a problem
        }

        // Webpack chunk loading errors
        if (errorObj.message?.match(/Cannot find module '\.\/\d+\.js'/)) {
          const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
          const isWebpackError = frames.some(
            frame => frame.filename?.includes('webpack') || 
                     frame.filename?.includes('.next/') ||
                     frame.filename?.includes('_document.js')
          );
          
          if (isWebpackError && process.env.NODE_ENV === 'development') {
            console.warn("Webpack chunk loading error - clear .next cache and restart dev server");
            return null; // Filter in dev
          }
        }

        // Webpack HMR module build errors (development only)
        if (process.env.NODE_ENV === 'development') {
          if (errorObj.name === 'ModuleBuildError' || 
              errorObj.message?.includes('Module build failed') ||
              errorObj.message?.includes('Syntax Error') ||
              errorObj.message?.match(/Expected '</)) {
            console.warn("Webpack HMR build error - transient syntax error during hot reload");
            return null; // Filter in dev
          }
        }
      }

      return event;
    },
  });
}
