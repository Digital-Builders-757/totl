// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  currentDSN,
  developmentDSN,
  productionDSN,
} from "@/lib/sentry/env";
import { scrubEvent } from "@/lib/sentry/scrub";

const SENTRY_DSN = currentDSN;

// Fail loudly if DSN is missing (no silent failures, no hardcoded fallbacks)
if (!SENTRY_DSN) {
  console.warn(
    "[Sentry Edge] ⚠️ SENTRY_DSN is missing - Sentry will be disabled. Set SENTRY_DSN_PROD or SENTRY_DSN_DEV in environment variables."
  );
}

Sentry.init({
  dsn: SENTRY_DSN ?? undefined,

  // Adjust sample rate based on environment
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set environment
  environment: process.env.VERCEL_ENV || "development",

  // Enable logs to be sent to Sentry (disabled in production to reduce noise)
  enableLogs: process.env.NODE_ENV !== "production",

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false, // Set to false for privacy in production

  // Ignore common errors
  // Keep this list minimal: only truly external/system noise
  ignoreErrors: [
    "NEXT_NOT_FOUND", 
    "NEXT_REDIRECT",
    // Note: EPIPE and dev-only errors are filtered in beforeSend
    // to avoid accidentally filtering real production issues
  ],

  // Filter out non-critical system errors before sending to Sentry
  beforeSend(event, hint) {
    const error = hint.originalException;

    // SECURITY: Scrub sensitive data from event (shared utility)
    event = scrubEvent(event);

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
    }

    return event;
  },
});
