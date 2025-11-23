/**
 * Narrow unknown errors to the special redirect error thrown by Next.js redirect().
 */
export function isRedirectError(error: unknown): error is { digest: string } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (!("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

