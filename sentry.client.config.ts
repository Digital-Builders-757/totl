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

// Use the working project for all environments
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609";

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

    // Replay settings - only in production and when not already initialized
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

    // Replay integration disabled to prevent multiple instances error
    // integrations: [],

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
    ],
  });
}
