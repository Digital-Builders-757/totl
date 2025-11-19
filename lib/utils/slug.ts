/**
 * Utility functions for creating URL-friendly slugs from names
 */

/**
 * Convert a name to a URL-friendly slug
 * Example: "John Doe" -> "john-doe"
 * Example: "Mary Jane Watson" -> "mary-jane-watson"
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Create a slug from first and last name
 */
export function createNameSlug(firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  return createSlug(fullName);
}

/**
 * Extract name parts from a slug (reverse operation)
 * Note: This is approximate and may not be perfect for all cases
 */
export function parseSlug(slug: string): { firstName: string; lastName: string } | null {
  const parts = slug.split("-");
  if (parts.length < 2) {
    return null;
  }
  // Assume last part is last name, rest is first name
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
}

