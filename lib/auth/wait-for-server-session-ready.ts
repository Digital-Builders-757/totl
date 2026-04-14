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
  /** When aborted, polling stops immediately (e.g. React effect cleanup). */
  signal?: AbortSignal;
};

/** Last outcome when `ok` is false — distinguishes cookie lag vs server vs transport. */
export type WaitForServerSessionTerminal =
  | "not_ready"
  | "server_error"
  | "fetch_timeout"
  | "network";

export type WaitForServerSessionReadyResult =
  | { ok: true; attempts: number }
  | { ok: false; aborted: true; attempts: number }
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

/** Fires when either signal aborts (no AbortSignal.any — broader Safari support). */
function mergeAbortSignals(timeoutSignal: AbortSignal, external?: AbortSignal): AbortSignal {
  if (!external) return timeoutSignal;
  if (timeoutSignal.aborted || external.aborted) {
    const done = new AbortController();
    done.abort();
    return done.signal;
  }
  const merged = new AbortController();
  const forward = () => merged.abort();
  timeoutSignal.addEventListener("abort", forward, { once: true });
  external.addEventListener("abort", forward, { once: true });
  return merged.signal;
}

function delayWithOptionalAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  if (signal == null) return new Promise((resolve) => setTimeout(resolve, ms));
  const sig = signal;
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(tid);
      sig.removeEventListener("abort", onAbort);
      resolve();
    };
    const tid = setTimeout(() => {
      sig.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    sig.addEventListener("abort", onAbort);
  });
}

type ProbeOnceResult =
  | { kind: "ok" }
  | { kind: "aborted" }
  | { kind: "not_ready"; lastHttpStatus: 401; lastBodyReason?: string }
  | { kind: "server_fail"; lastHttpStatus: number; lastBodyReason?: string }
  | { kind: "fetch_timeout" }
  | { kind: "network" };

async function probeSessionReadyOnce(
  perFetchTimeoutMs: number,
  externalSignal?: AbortSignal
): Promise<ProbeOnceResult> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), perFetchTimeoutMs);
  try {
    const response = await fetch("/api/auth/session-ready", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal: mergeAbortSignals(ac.signal, externalSignal),
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
      if (externalSignal?.aborted) {
        return { kind: "aborted" };
      }
      return { kind: "fetch_timeout" };
    }
    return { kind: "network" };
  }
}

type FailedProbe = Exclude<ProbeOnceResult, { kind: "ok" } | { kind: "aborted" }>;

function terminalFromLastProbe(last: FailedProbe): Omit<
  Extract<WaitForServerSessionReadyResult, { ok: false; terminal: WaitForServerSessionTerminal }>,
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
  const signal = options?.signal;

  const started = Date.now();
  let attempt = 0;
  let lastFailedProbe: FailedProbe = { kind: "not_ready", lastHttpStatus: 401 };

  while (Date.now() - started < maxWaitMs) {
    if (signal?.aborted) {
      return { ok: false, aborted: true, attempts: attempt };
    }

    const probe = await probeSessionReadyOnce(perFetchTimeoutMs, signal);

    if (probe.kind === "ok") {
      return { ok: true, attempts: attempt + 1 };
    }

    if (probe.kind === "aborted") {
      return { ok: false, aborted: true, attempts: attempt + 1 };
    }

    lastFailedProbe = probe;

    const wait = nextBackoffMs(attempt, initialBackoffMs, maxBackoffMs);
    const elapsed = Date.now() - started;
    const remaining = maxWaitMs - elapsed;
    if (remaining <= 0) {
      break;
    }
    await delayWithOptionalAbort(Math.min(wait, remaining), signal);
    if (signal?.aborted) {
      return { ok: false, aborted: true, attempts: attempt + 1 };
    }
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
  maxBackoffMs = 2_600,
  signal?: AbortSignal
): Promise<void> {
  const ms = nextBackoffMs(attempt, initialBackoffMs, maxBackoffMs);
  await delayWithOptionalAbort(ms, signal);
}
