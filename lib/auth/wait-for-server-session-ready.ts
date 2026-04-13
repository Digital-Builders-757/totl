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
  /** Max time (ms) for a single fetch; avoids hanging on stalled connections. */
  perFetchTimeoutMs?: number;
};

/** Last outcome when `ok` is false — distinguishes cookie lag vs server vs transport. */
export type WaitForServerSessionTerminal =
  | "not_ready"
  | "server_error"
  | "fetch_timeout"
  | "network";

export type WaitForServerSessionReadyResult =
  | { ok: true; attempts: number }
  | {
      ok: false;
      terminal: WaitForServerSessionTerminal;
      attempts: number;
      lastHttpStatus?: number;
      lastBodyReason?: string;
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

type ProbeOnceResult =
  | { kind: "ok" }
  | { kind: "not_ready"; lastHttpStatus: 401; lastBodyReason?: string }
  | { kind: "server_fail"; lastHttpStatus: number; lastBodyReason?: string }
  | { kind: "fetch_timeout" }
  | { kind: "network" };

async function probeSessionReadyOnce(perFetchTimeoutMs: number): Promise<ProbeOnceResult> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), perFetchTimeoutMs);
  try {
    const response = await fetch("/api/auth/session-ready", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal: ac.signal,
    });
    clearTimeout(timer);

    if (response.ok) {
      return { kind: "ok" };
    }

    let lastBodyReason: string | undefined;
    try {
      const j = (await response.json()) as { reason?: string };
      if (typeof j.reason === "string") lastBodyReason = j.reason;
    } catch {
      // Non-JSON error body — ignore.
    }

    if (response.status === 401) {
      return { kind: "not_ready", lastHttpStatus: 401, lastBodyReason };
    }
    return { kind: "server_fail", lastHttpStatus: response.status, lastBodyReason };
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      return { kind: "fetch_timeout" };
    }
    return { kind: "network" };
  }
}

type FailedProbe = Exclude<ProbeOnceResult, { kind: "ok" }>;

function terminalFromLastProbe(last: FailedProbe): Omit<
  Extract<WaitForServerSessionReadyResult, { ok: false }>,
  "ok" | "attempts"
> {
  switch (last.kind) {
    case "not_ready":
      return {
        terminal: "not_ready",
        lastHttpStatus: last.lastHttpStatus,
        lastBodyReason: last.lastBodyReason,
      };
    case "server_fail":
      return {
        terminal: "server_error",
        lastHttpStatus: last.lastHttpStatus,
        lastBodyReason: last.lastBodyReason,
      };
    case "fetch_timeout":
      return { terminal: "fetch_timeout" };
    case "network":
      return { terminal: "network" };
    default: {
      const _x: never = last;
      return _x;
    }
  }
}

export async function waitForServerSessionReady(
  options?: WaitForServerSessionReadyOptions
): Promise<WaitForServerSessionReadyResult> {
  const maxWaitMs = options?.maxWaitMs ?? 40_000;
  const initialBackoffMs = options?.initialBackoffMs ?? 280;
  const maxBackoffMs = options?.maxBackoffMs ?? 2_600;
  const perFetchTimeoutMs = options?.perFetchTimeoutMs ?? 12_000;

  const started = Date.now();
  let attempt = 0;
  let lastFailedProbe: FailedProbe = { kind: "not_ready", lastHttpStatus: 401 };

  while (Date.now() - started < maxWaitMs) {
    const probe = await probeSessionReadyOnce(perFetchTimeoutMs);

    if (probe.kind === "ok") {
      return { ok: true, attempts: attempt + 1 };
    }

    lastFailedProbe = probe;

    const wait = nextBackoffMs(attempt, initialBackoffMs, maxBackoffMs);
    const elapsed = Date.now() - started;
    const remaining = maxWaitMs - elapsed;
    if (remaining <= 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(wait, remaining)));
    attempt += 1;
  }

  const { terminal, lastHttpStatus, lastBodyReason } = terminalFromLastProbe(lastFailedProbe);
  return {
    ok: false,
    terminal,
    attempts: attempt + 1,
    lastHttpStatus,
    lastBodyReason,
  };
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
