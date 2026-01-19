/**
 * Shared Sentry event scrubbing utility
 * 
 * Scrubs sensitive data from Sentry events before sending:
 * - Authorization headers, cookies, API keys, tokens
 * - Large request payloads (>10KB)
 * - Sensitive keys in extra context, contexts, and user data
 * 
 * Used by: sentry.server.config.ts, sentry.edge.config.ts, instrumentation-client.ts
 */

const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "apikey",
  "token",
  "secret",
  "password",
];

/**
 * Recursively scrub sensitive keys from an object
 */
function scrub(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(scrub);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => key.includes(s))) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = scrub(v);
    }
  }
  return out;
}

/**
 * Scrub sensitive data from a Sentry event
 * 
 * Uses a generic type to avoid requiring @sentry/types as a separate dependency.
 * The function mutates the event object in place and returns it typed as the input type.
 */
export function scrubEvent<T = unknown>(event: T): T {
  if (!event || typeof event !== "object") return event;
  const evt = event as Record<string, unknown>;
  
  // Scrub request headers
  if (evt.request && typeof evt.request === "object") {
    const request = evt.request as Record<string, unknown>;
    if (request.headers) {
      request.headers = scrub(request.headers);
    }
    if (request.data) {
      const dataStr = JSON.stringify(request.data);
      if (dataStr.length > 10000) {
        request.data = "[REDACTED - Large payload]";
      } else {
        request.data = scrub(request.data);
      }
    }
  }

  // Scrub extra context
  if (evt.extra) {
    evt.extra = scrub(evt.extra);
  }

  // Scrub contexts
  if (evt.contexts) {
    evt.contexts = scrub(evt.contexts);
  }

  // Scrub user data (keep id/email for debugging, but remove tokens)
  if (evt.user) {
    evt.user = scrub(evt.user);
  }

  return event;
}
