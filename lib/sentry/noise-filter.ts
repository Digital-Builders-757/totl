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
  if (
    !errorMessage.includes("Cannot read properties of undefined (reading 'call')") &&
    !/Cannot find module '\.\/\d+\.js'/.test(errorMessage)
  ) {
    return false;
  }

  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

  return frames.some((frame) => {
    const filename = frame.filename ?? "";
    const moduleName = frame.module ?? "";

    return (
      filename.includes("webpack") ||
      filename.includes("bootstrap") ||
      filename.includes("_next/static/chunks") ||
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

  return (
    normalizedMessage.includes("event `event`") &&
    serializedType === "error" &&
    serializedTarget.includes("head > link")
  );
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
    (normalizedMessage.includes("enoent") && normalizedMessage.includes("_document.js"));

  if (!mentionsLocalRenderFailure) return false;

  return frames.some((frame) => {
    const filename = (frame.filename ?? "").toLowerCase();
    const moduleName = (frame.module ?? "").toLowerCase();

    return (
      filename.includes("webpack/bootstrap") ||
      filename.includes("app-page.runtime.prod") ||
      filename.includes("pages-handler") ||
      filename.includes("get-page-files") ||
      filename.includes("_document.js") ||
      filename.includes(".next/server") ||
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
