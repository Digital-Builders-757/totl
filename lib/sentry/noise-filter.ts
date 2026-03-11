type SentryEventLike = {
  request?: {
    url?: string;
  };
  tags?: Record<string, unknown>;
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

export function shouldFilterLocalWebpackNoise(
  event: SentryEventLike,
  errorMessage: string
): boolean {
  const isLocalSignal = isLocalhostUrl(getEventUrl(event)) || hasAutomationBrowserTag(event);

  if (!isLocalSignal) return false;

  return isWebpackBootstrapError(event, errorMessage);
}
