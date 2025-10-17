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
  ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],
});
