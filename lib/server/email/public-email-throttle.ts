import "server-only";

/**
 * Lightweight abuse throttle for public email routes.
 *
 * Notes:
 * - Best-effort only (in-memory; not durable across serverless instances).
 * - MUST NOT change response semantics (avoid account existence leaks).
 * - Goal is to reduce provider spam + accidental UI hammering.
 */

type ThrottleKeyParts = {
  route: "send-verification" | "send-password-reset";
  email: string;
  ip: string;
};

type ThrottleState = { count: number; windowStartMs: number };

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 10; // generous for UX; still stops spam-click floods
const MAX_STORE_SIZE = 5_000; // safety cap to avoid unbounded growth in long-lived processes
const PRUNE_INTERVAL_CALLS = 200; // prune occasionally to reduce per-request overhead

function getStore() {
  const g = globalThis as unknown as {
    __totlEmailThrottle?: Map<string, ThrottleState>;
    __totlEmailThrottleCalls?: number;
  };
  if (!g.__totlEmailThrottle) g.__totlEmailThrottle = new Map();
  if (!g.__totlEmailThrottleCalls) g.__totlEmailThrottleCalls = 0;
  return g.__totlEmailThrottle;
}

function tickAndMaybePrune(now: number) {
  const g = globalThis as unknown as {
    __totlEmailThrottle?: Map<string, ThrottleState>;
    __totlEmailThrottleCalls?: number;
  };
  const store = g.__totlEmailThrottle;
  if (!store) return;

  g.__totlEmailThrottleCalls = (g.__totlEmailThrottleCalls ?? 0) + 1;
  const calls = g.__totlEmailThrottleCalls;

  const shouldPrune = store.size > MAX_STORE_SIZE || calls % PRUNE_INTERVAL_CALLS === 0;
  if (!shouldPrune) return;

  // Delete expired entries (2 windows for safety).
  const cutoff = now - WINDOW_MS * 2;
  for (const [k, v] of store.entries()) {
    if (v.windowStartMs < cutoff) store.delete(k);
  }

  // If still too large, do a coarse reset (best-effort throttle; favor safety).
  if (store.size > MAX_STORE_SIZE) store.clear();
}

function buildKey({ route, email, ip }: ThrottleKeyParts) {
  return `${route}::${ip}::${email.toLowerCase().trim()}`;
}

export function getRequestIp(request: Request) {
  const h = request.headers;
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf;

  const real = h.get("x-real-ip");
  if (real) return real;

  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";

  return "unknown";
}

/**
 * Returns true if the request should be throttled.
 */
export function shouldThrottlePublicEmail(args: Omit<ThrottleKeyParts, "ip"> & { request: Request }) {
  const ip = getRequestIp(args.request);
  const key = buildKey({ route: args.route, email: args.email, ip });
  const now = Date.now();
  const store = getStore();
  tickAndMaybePrune(now);

  const existing = store.get(key);
  if (!existing || now - existing.windowStartMs > WINDOW_MS) {
    store.set(key, { count: 1, windowStartMs: now });
    return false;
  }

  existing.count += 1;
  store.set(key, existing);
  return existing.count > MAX_PER_WINDOW;
}

