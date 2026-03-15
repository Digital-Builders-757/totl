type SentryEventLike = {
  message?: string;
  logentry?: {
    message?: string;
  };
  request?: {
    url?: string;
  };
  tags?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  exception?: {
    values?: Array<{
      stacktrace?: {
        frames?: Array<{
          filename?: string;
          module?: string;
        }>;
      };
    }>;
  };
};

function getEventUrl(event: SentryEventLike): string | null {
  if (event.request?.url) return event.request.url;

  const tagUrl = event.tags?.url;
  return typeof tagUrl === "string" ? tagUrl : null;
}

function isLocalhostUrl(url: string | null): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1"
    );
  } catch {
    return url.includes("localhost") || url.includes("127.0.0.1");
  }
}

function hasAutomationBrowserTag(event: SentryEventLike): boolean {
  const browserTag = String(event.tags?.browser ?? "");
  const browserNameTag = String(event.tags?.["browser.name"] ?? "");
  const combined = `${browserTag} ${browserNameTag}`.toLowerCase();

  return combined.includes("headlesschrome") || combined.includes("electron");
}

function isWebpackBootstrapError(event: SentryEventLike, errorMessage: string): boolean {
  const isKnownChunkError =
    errorMessage.includes("Cannot read properties of undefined (reading 'call')") ||
    /Cannot find module '\.\/\d+\.js'/.test(errorMessage) ||
    /e\[o\] is not a function/.test(errorMessage) ||
    /^\w+\[\w+\] is not a function$/.test(errorMessage);
  if (!isKnownChunkError) {
    return false;
  }

  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

  return frames.some((frame) => {
    const filename = (frame.filename ?? "").toLowerCase();
    const moduleName = (frame.module ?? "").toLowerCase();

    return (
      filename.includes("webpack") ||
      filename.includes("bootstrap") ||
      filename.includes("_next/static/chunks") ||
      filename.includes("chunks/webpack") ||
      filename.includes(".next/server") ||
      moduleName.includes("webpack-runtime")
    );
  });
}

function getEventMessage(event: SentryEventLike, errorMessage: string): string {
  if (errorMessage) return errorMessage;
  if (typeof event.message === "string") return event.message;
  if (typeof event.logentry?.message === "string") return event.logentry.message;

  const extraMessage = event.extra?.message;
  if (typeof extraMessage === "string") return extraMessage;

  return "";
}

function getSerializedEventData(event: SentryEventLike): Record<string, unknown> | null {
  const serialized = event.extra?.__serialized__;
  if (!serialized || typeof serialized !== "object") return null;
  return serialized as Record<string, unknown>;
}

export function shouldFilterLocalWebpackNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);

  if (!isLocalSignal) return false;

  return isWebpackBootstrapError(event, errorMessage);
}

/**
 * Filter: Webpack chunk loading errors in production (e.g. "e[o] is not a function").
 * Stale chunks after deployment or transient load failures. Not actionable.
 * Sentry issues: TOTLMODELAGENCY-35, 33, 32, 34
 */
export function shouldFilterWebpackChunkLoadNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  if (!isWebpackBootstrapError(event, errorMessage)) return false;
  // Only filter when stack clearly points to webpack/chunks (already checked in isWebpackBootstrapError)
  return true;
}

export function shouldFilterLocalFailedFetchNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
  if (!isLocalSignal) return false;

  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  const details = String(event.extra?.details ?? "").toLowerCase();
  const extraMessage = String(event.extra?.message ?? "").toLowerCase();

  const mentionsFailedFetch =
    normalizedMessage.includes("failed to fetch") ||
    details.includes("failed to fetch") ||
    extraMessage.includes("failed to fetch");

  return mentionsFailedFetch;
}

export function shouldFilterLocalResourceEventNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
  if (!isLocalSignal) return false;

  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  const serialized = getSerializedEventData(event);
  const serializedType = String(serialized?.type ?? "").toLowerCase();
  const serializedTarget = String(serialized?.target ?? "").toLowerCase();

  // Resource load: Event on head > link (2N)
  const isResourceLoadEvent =
    normalizedMessage.includes("event `event`") &&
    serializedType === "error" &&
    serializedTarget.includes("head > link");

  // Promise rejection: Event (type=error) captured as promise rejection on dashboard routes
  const isPromiseRejectionEvent =
    normalizedMessage.includes("event `event`") &&
    normalizedMessage.includes("type=error") &&
    normalizedMessage.includes("captured as promise rejection");

  return isResourceLoadEvent || isPromiseRejectionEvent;
}

export function shouldFilterLocalServerRenderNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
  if (!isLocalSignal) return false;

  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

  const mentionsLocalRenderFailure =
    normalizedMessage.includes("cannot read properties of undefined (reading 'call')") ||
    normalizedMessage.includes("cannot read properties of undefined (reading '/_app')") ||
    normalizedMessage.includes("unexpected end of json input") ||
    (normalizedMessage.includes("enoent") && normalizedMessage.includes("_document.js")) ||
    (normalizedMessage.includes("could not find the module") &&
      normalizedMessage.includes("segment-explorer-node") &&
      normalizedMessage.includes("react client manifest"));

  if (!mentionsLocalRenderFailure) return false;

  return frames.some((frame) => {
    const filename = (frame.filename ?? "").toLowerCase();
    const moduleName = (frame.module ?? "").toLowerCase();

    return (
      filename.includes("webpack/bootstrap") ||
      filename.includes("webpack") ||
      filename.includes("app-page.runtime.prod") ||
      filename.includes("pages-handler") ||
      filename.includes("get-page-files") ||
      filename.includes("_document.js") ||
      filename.includes(".next/server") ||
      filename.includes("load-manifest") ||
      filename.includes("next-dev-server") ||
      filename.includes("next/server") ||
      moduleName.includes("webpack-runtime")
    );
  });
}

export function shouldFilterHandledLoadFailedNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  const hasStack = Boolean(
    event.exception?.values?.[0]?.stacktrace?.frames &&
      event.exception.values[0].stacktrace.frames.length
  );
  const isHandled = String(event.tags?.handled ?? "") === "yes";

  return normalizedMessage.includes("load failed") && isHandled && !hasStack;
}

export function shouldFilterLocalWebStreamNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
  if (!isLocalSignal) return false;

  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();

  return normalizedMessage.includes("controller[kstate].transformalgorithm is not a function");
}

/**
 * Filter Supabase auth-js lock AbortError. Check error.name (not just message)
 * since AbortError typically has message "signal is aborted without reason"
 * and "AbortError" lives in error.name.
 */
export function shouldFilterSupabaseLockAbortNoise(
  event: SentryEventLike,
  errorOrMessage: unknown
): boolean {
  const e = errorOrMessage as { name?: string; message?: string } | null | undefined;
  const name = String(e?.name ?? "").toLowerCase();
  const msg = String(e?.message ?? getEventMessage(event, "")).toLowerCase();

  const isAbortError =
    name === "aborterror" || msg.includes("signal is aborted without reason");
  if (!isAbortError) return false;

  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
  return frames.some((frame) => {
    const filename = (frame.filename ?? "").toLowerCase();
    return filename.includes("auth-js") && filename.includes("locks");
  });
}

/**
 * Filter: [totl][email] sending disabled (DISABLE_EMAIL_SENDING=1)
 * From localhost/HeadlessChrome during Playwright tests. Intentional no-op, not actionable.
 * Sentry issue: TOTLMODELAGENCY-2E
 */
export function shouldFilterLocalEmailDisabledNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
  if (!isLocalSignal) return false;

  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  return (
    normalizedMessage.includes("[totl][email] sending disabled") ||
    normalizedMessage.includes("disable_email_sending")
  );
}

/**
 * Filter: "The invite link did not include a valid authentication token"
 * From localhost when user hits /auth/callback without valid tokens (e.g. refresh after cleanup,
 * or Playwright hitting callback without tokens). Handled in UI, not actionable.
 * Sentry issue: TOTLMODELAGENCY-2X
 */
export function shouldFilterLocalAuthCallbackInvalidTokenNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
  if (!isLocalSignal) return false;

  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  const isHandled = String(event.tags?.handled ?? "") === "yes";

  return (
    normalizedMessage.includes("invite link did not include a valid authentication token") &&
    isHandled
  );
}

/**
 * Filter: "Object captured as exception with keys: code, details, hint, message"
 * Raw Supabase/PostgREST object passed to Sentry instead of Error. From localhost/talent-dashboard.
 * Sentry issue: TOTLMODELAGENCY-1N
 */
export function shouldFilterLocalObjectCapturedAsExceptionNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);
  if (!isLocalSignal) return false;

  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  const serialized = getSerializedEventData(event);
  const serializedMessage = String(serialized?.message ?? "").toLowerCase();

  return (
    normalizedMessage.includes("object captured as exception with keys") ||
    (normalizedMessage.includes("object captured as exception") &&
      (serializedMessage.includes("failed to fetch") || serializedMessage.includes("supabase")))
  );
}

/**
 * Filter: "aborted" at abortIncoming(node:_http_server)
 * Client disconnected during HTTP request. Server-side, not actionable.
 * Sentry issue: TOTLMODELAGENCY-2M
 */
/**
 * Filter: [auth.onAuthStateChange] redirect timeout fallback telemetry
 * Expected behavior when router.replace doesn't navigate in time - we fall back to hard reload.
 * Informational, not actionable. Sentry issue: TOTLMODELAGENCY-2B
 */
export function shouldFilterAuthRedirectTimeoutTelemetry(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const normalizedMessage = getEventMessage(event, errorMessage);
  return normalizedMessage.includes("[auth.onAuthStateChange] redirect timeout fallback telemetry");
}

export function shouldFilterServerAbortIncomingNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const normalizedMessage = getEventMessage(event, errorMessage).toLowerCase();
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

  if (normalizedMessage !== "aborted") return false;

  return frames.some((frame) => {
    const filename = (frame.filename ?? "").toLowerCase();
    return (
      filename.includes("abortincoming") ||
      filename.includes("_http_server") ||
      filename.includes("node:net")
    );
  });
}

/**
 * Filter: [totl][email] password reset / verification link generation failed
 * Expected when: (1) password reset for non-existent email, (2) verification for already-registered user.
 * Routes return success to avoid leaking user existence; these are not actionable.
 * Sentry issues: TOTLMODELAGENCY-3A, TOTLMODELAGENCY-39
 */
export function shouldFilterExpectedEmailLinkGenerationNoise(
  event: SentryEventLike,
  _errorMessage: string
): boolean {
  const msg = getEventMessage(event, _errorMessage);
  if (!msg.includes("[totl][email]") || !msg.includes("link generation failed")) {
    return false;
  }

  const errorMsg = String(event.extra?.errorMessage ?? "").toLowerCase();
  const isExpectedPasswordReset =
    errorMsg.includes("user with this email not found") ||
    errorMsg.includes("user not found");
  const isExpectedVerification =
    errorMsg.includes("already been registered") ||
    errorMsg.includes("already registered");

  return isExpectedPasswordReset || isExpectedVerification;
}
