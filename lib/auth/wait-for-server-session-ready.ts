/**
 * Client-only: probes until the Next.js route handler sees the same session as the browser.
 * Invite / OTP flows often need extra time for cookies to sync (notably mobile Safari).
 */

export type WaitForServerSessionReadyOptions = {
  /** Hard cap on total wait time (ms). */
  maxWaitMs?: number;
  /** Base delay (ms) before the first retry; grows exponentially with a cap. */
  initialBackoffMs?: number;
  /** Maximum delay (ms) between retries. */
  maxBackoffMs?: number;
};

function nextBackoffMs(
  attempt: number,
  initialBackoffMs: number,
  maxBackoffMs: number
): number {
  const exp = Math.min(maxBackoffMs, initialBackoffMs * 2 ** Math.min(attempt, 8));
  const jitter = Math.floor(Math.random() * 150);
  return exp + jitter;
}

export async function waitForServerSessionReady(
  options?: WaitForServerSessionReadyOptions
): Promise<boolean> {
  const maxWaitMs = options?.maxWaitMs ?? 40_000;
  const initialBackoffMs = options?.initialBackoffMs ?? 280;
  const maxBackoffMs = options?.maxBackoffMs ?? 2_600;

  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < maxWaitMs) {
    try {
      const response = await fetch("/api/auth/session-ready", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (response.ok) {
        return true;
      }
    } catch {
      // Network / abort — treat as not ready and retry.
    }

    const wait = nextBackoffMs(attempt, initialBackoffMs, maxBackoffMs);
    const elapsed = Date.now() - started;
    const remaining = maxWaitMs - elapsed;
    if (remaining <= 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(wait, remaining)));
    attempt += 1;
  }

  return false;
}

/** Used by auth callback boot polling — same backoff shape as session-ready. */
export async function sleepBootRetryDelayMs(
  attempt: number,
  initialBackoffMs = 280,
  maxBackoffMs = 2_600
): Promise<void> {
  const ms = nextBackoffMs(attempt, initialBackoffMs, maxBackoffMs);
  await new Promise((resolve) => setTimeout(resolve, ms));
}
