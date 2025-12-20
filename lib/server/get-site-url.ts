import "server-only";

/**
 * Canonical server-only origin resolver.
 *
 * We use this for:
 * - Supabase auth redirect URLs (generateLink redirectTo)
 * - Email links (login/dashboard links, etc.)
 *
 * Contract: do NOT inline `${process.env.NEXT_PUBLIC_SITE_URL}/...` in call sites.
 */
export function getSiteUrl() {
  // Highest priority: explicit canonical origin.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return normalizeOrigin(explicit);

  // Vercel provides a hostname without protocol.
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");

  // Local fallback.
  return "http://localhost:3000";
}

export function absoluteUrl(pathname: string) {
  const base = getSiteUrl();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, base).toString();
}

function normalizeOrigin(originOrUrl: string) {
  try {
    // If a full URL is provided, keep origin.
    const url = new URL(originOrUrl);
    return url.origin;
  } catch {
    const raw = String(originOrUrl).trim().replace(/\/+$/, "");
    const withoutProto = raw.replace(/^https?:\/\//, "");
    const isLocalhost = /(localhost|127\.0\.0\.1)(:\d+)?$/i.test(withoutProto);

    // If it's just a hostname, assume https — except localhost should default to http.
    const proto = isLocalhost ? "http" : "https";
    return `${proto}://${withoutProto}`.replace(/\/+$/, "");
  }
}

