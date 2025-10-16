// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Use the working project for all environments
const SENTRY_DSN =
  process.env.SENTRY_DSN ||
  "https://9f271197ad8ee6ef9c43094ffae46796@o4510191106654208.ingest.us.sentry.io/4510191108292609";

Sentry.init({
  dsn: SENTRY_DSN,

  // Adjust sample rate based on environment
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set environment
  environment: process.env.VERCEL_ENV || "development",

  // Enable logs to be sent to Sentry (disabled in production to reduce noise)
  enableLogs: process.env.NODE_ENV !== "production",

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false, // Set to false for privacy in production
});
