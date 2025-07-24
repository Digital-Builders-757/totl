/**
 * Utility function to get a fallback image URL
 * @param src - Original image source
 * @param fallback - Fallback image URL
 * @param type - Type of fallback to use (static or placeholder)
 * @param query - Query string for placeholder image
 * @param width - Width for placeholder
 * @param height - Height for placeholder
 * @returns Fallback image URL
 */
export function getFallbackImage(
  src: string | null | undefined,
  fallback = "/images/totl-logo-transparent.png",
  type = "static",
  query = "image",
  width = 300,
  height = 300
): string {
  if (src) {
    return src;
  }

  if (type === "static") {
    return fallback;
  }

  // For placeholder type, return a simple fallback
  return fallback;
}
