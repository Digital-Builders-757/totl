import "server-only";

/**
 * Safe JSON body reader for route handlers.
 *
 * Next's `request.json()` can throw if the body is empty or truncated, which can
 * turn a "400 missing fields" into a noisy 500. For internal endpoints (and tests),
 * we prefer a stable `{}` fallback so normal validation can run.
 */
export async function safeRequestJson<T extends Record<string, unknown> = Record<string, unknown>>(
  request: Request
): Promise<T> {
  const raw = await request.text();
  if (!raw) return {} as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

