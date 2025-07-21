/**
 * Returns a safe URL for images, with fallback if the URL is invalid
 *
 * @param url - The image URL (can be undefined, null, or empty string)
 * @param fallback - Fallback URL to use if the provided URL is invalid
 * @param type - Type of fallback to use (static or placeholder)
 * @param query - Query string for placeholder image
 * @param width - Width for placeholder
 * @param height - Height for placeholder
 * @returns A valid image URL
 */
export function getSafeImageUrl(
  url?: string | null,
  {
    fallback = "/placeholder.jpg",
    type = "placeholder",
    query = "image",
    width = 400,
    height = 400,
  } = {}
): string {
  // Check if URL is valid
  if (url && url.trim() !== "") {
    return url;
  }

  // Return appropriate fallback
  if (type === "placeholder") {
    return `/placeholder.svg?height=${height}&width=${width}&query=${query}`;
  }

  return fallback;
}
