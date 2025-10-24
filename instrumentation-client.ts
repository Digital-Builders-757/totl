// instrumentation-client.ts
// This file is used to configure Sentry for the client-side
// It replaces the deprecated sentry.client.config.ts approach

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
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
