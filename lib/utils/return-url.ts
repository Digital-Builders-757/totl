export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.includes("://") || value.startsWith("//")) return null;
  if (!value.startsWith("/")) return null;
  return value;
}


