// This file configures the initialization of Sentry for the browser/client runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { currentDSN } from "@/lib/sentry/env";
import { scrubEvent } from "@/lib/sentry/scrub";

const SENTRY_DSN = currentDSN;

if (!SENTRY_DSN) {
  console.warn(
    "[Sentry Client] ⚠️ SENTRY_DSN is missing - Sentry will be disabled. Set SENTRY_DSN_PROD or SENTRY_DSN_DEV in environment variables."
  );
}

function isGenericLoadFailedNetworkNoise(error: unknown, event: Sentry.Event) {
  const errorMessage =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  // Safari (and some flaky networks) can surface fetch failures as a bare:
  //   TypeError: Load failed
  // with little/no actionable stack.
  if (errorMessage !== "Load failed" && !errorMessage.includes("Load failed")) {
    return false;
  }

  const hasStack = Boolean(
    event.exception?.values?.[0]?.stacktrace?.frames &&
      event.exception.values[0].stacktrace.frames.length
  );

  // If we have a real stack, keep it.
  if (hasStack) return false;

  // Only filter handled (non-crashing) errors.
  const handled = event.tags?.handled;
  const isHandled = handled === "yes";
  if (!isHandled) return false;

  return true;
}

Sentry.init({
  dsn: SENTRY_DSN ?? undefined,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.VERCEL_ENV || "development",

  enableLogs: process.env.NODE_ENV !== "production",
  sendDefaultPii: false,

  ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT"],

  beforeSend(event, hint) {
    const error = hint.originalException;

    event = scrubEvent(event);

    if (isGenericLoadFailedNetworkNoise(error, event)) {
      return null;
    }

    return event;
  },
});
