/**
 * Maps thrown values and common vendor messages to stable, non-technical user copy.
 * Full detail must always be logged separately with logger — never rely on this for debugging.
 */

const GENERIC =
  "Something went wrong on our end. Please try again in a moment. If it keeps happening, contact support.";

const NETWORK =
  "We couldn’t reach our servers. Check your connection and try again.";

/** Strip noisy prefixes some layers add */
function normalizeMessage(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function messageFromUnknown(err: unknown): string {
  if (err instanceof Error) return normalizeMessage(err.message);
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return normalizeMessage((err as { message: string }).message);
  }
  return normalizeMessage(String(err));
}

/**
 * Returns user-safe description text (for toasts, alerts, inline).
 * Optional `fallback` overrides the generic unknown case (e.g. shorter copy for admin toasts).
 */
export function userSafeMessage(err: unknown, fallback: string = GENERIC): string {
  const msg = messageFromUnknown(err);
  const lower = msg.toLowerCase();

  if (!msg || msg === "undefined" || msg === "null") {
    return fallback;
  }

  // Network / transport (browser + Node)
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("socket hang up") ||
    lower.includes("aborted")
  ) {
    return NETWORK;
  }

  // Supabase Auth (common user-facing)
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Email or password doesn’t match our records. Try again or reset your password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the verification link.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("jwt") && lower.includes("expired")) {
    return "Your session expired. Please sign in again.";
  }

  // PostgREST / RLS (never show raw codes to end users)
  if (
    lower.includes("row-level security") ||
    lower.includes("rls") ||
    lower.includes("permission denied") ||
    lower.includes("violates row-level security") ||
    /^pgrst\d+/i.test(msg) ||
    lower.includes("postgrest")
  ) {
    return "You don’t have permission to complete this action, or the item is no longer available.";
  }

  if (lower.includes("duplicate key") || lower.includes("unique constraint")) {
    return "This record already exists. Refresh and try again, or change the conflicting value.";
  }

  if (lower.includes("foreign key") || lower.includes("23503")) {
    return "This action couldn’t be completed because related data is missing or was removed.";
  }

  // Stripe-ish (keep vague)
  if (lower.includes("stripe") || lower.includes("payment_intent") || lower.includes("checkout")) {
    return "We couldn’t process billing right now. Please try again or update your payment method.";
  }

  // Config / env leaks (dev mistakes hitting prod)
  if (lower.includes("next_public_supabase") || lower.includes("missing env")) {
    return "This feature is temporarily unavailable. Please try again later.";
  }

  // If it still looks like a stack or SQL dump, use fallback
  if (msg.length > 200 || lower.includes("at ") || lower.includes("select ") || lower.includes("insert ")) {
    return fallback;
  }

  return fallback;
}

/**
 * For server actions that return `{ error: string }` where the string might be internal.
 */
export function userSafeActionError(err: unknown): string {
  return userSafeMessage(err);
}
