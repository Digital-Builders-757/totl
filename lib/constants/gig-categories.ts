/**
 * Canonical Gig Categories Module
 * 
 * Single source of truth for all gig category logic across the application.
 * Prevents category drift and ensures consistent normalization, display, and filtering.
 */

export const GIG_CATEGORIES = [
  "modeling",
  "acting",
  "photography",
  "video",
  "influencer",
  "dancer",
  "musician",
  "other",
] as const;

/**
 * Categories visible in UI dropdowns (excludes "other" for cleaner UX)
 */
export const VISIBLE_GIG_CATEGORIES = [
  "modeling",
  "acting",
  "photography",
  "video",
  "influencer",
  "dancer",
  "musician",
] as const;

export type GigCategory = (typeof GIG_CATEGORIES)[number];

type CategoryInput = string | null | undefined;

/**
 * Maps legacy modeling-specific categories to new normalized categories
 */
export const LEGACY_CATEGORY_MAP: Record<string, GigCategory> = {
  // Modeling-specific → modeling
  editorial: "modeling",
  commercial: "modeling",
  runway: "modeling",
  print: "modeling",
  fitness: "modeling",
  beauty: "modeling",
  // Promotional/e-commerce → influencer (closer intent than modeling)
  promotional: "influencer",
  "e-commerce": "influencer",
  // Generic fallback
  other: "other",
};

/**
 * Maps new categories to all DB values that should match for filtering
 * Used for backward compatibility when filtering gigs
 */
export const CATEGORY_FILTER_SETS = {
  modeling: ["modeling", "editorial", "commercial", "runway", "print", "fitness", "beauty"],
  influencer: ["influencer", "promotional", "e-commerce"],
  acting: ["acting"],
  photography: ["photography"],
  video: ["video"],
  dancer: ["dancer"],
  musician: ["musician"],
  other: ["other"],
} satisfies Record<GigCategory, string[]>;

/**
 * Category display labels (optimized: created once, not on every call)
 */
const LABELS = {
  modeling: "Modeling",
  acting: "Acting",
  photography: "Photography",
  video: "Video",
  influencer: "Influencer",
  dancer: "Dancer",
  musician: "Musician",
  other: "Other",
} satisfies Record<GigCategory, string>;

/**
 * Badge variant mappings (optimized: created once, not on every call)
 */
const BADGE_VARIANTS = {
  modeling: "default" as const,
  acting: "secondary" as const,
  photography: "outline" as const,
  video: "secondary" as const,
  influencer: "default" as const,
  dancer: "outline" as const,
  musician: "secondary" as const,
  other: "outline" as const,
} satisfies Record<GigCategory, "default" | "secondary" | "outline">;

/**
 * Type guard to check if a string is a valid GigCategory
 * Removes need for type assertion in normalizeGigCategory
 */
function isGigCategory(value: string): value is GigCategory {
  return (GIG_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Normalizes any category string (legacy or new) to a canonical GigCategory
 * 
 * Safety: Unknown categories normalize to "other" (not "modeling") to prevent misclassification
 * 
 * @param category - Category string from DB or user input (can be null/undefined)
 * @returns Normalized GigCategory (never throws, always returns valid category)
 */
export function normalizeGigCategory(category: CategoryInput): GigCategory {
  const raw = String(category ?? "").trim();
  const c = raw.toLowerCase();
  
  // Empty input → "other" (no warning, expected for empty strings)
  if (!raw) {
    return "other";
  }
  
  // Check if it's already a canonical category (using type guard for cleaner TS)
  if (isGigCategory(c)) {
    return c;
  }
  
  // Check legacy mapping
  const mapped = LEGACY_CATEGORY_MAP[c];
  if (mapped) {
    return mapped;
  }
  
  // Unknown non-empty category → "other" (safe fallback, prevents misclassification)
  // Only warn on non-empty unknown values (keeps logs clean and meaningful)
  // In production, you might want to log this to Sentry for data quality monitoring
  if (process.env.NODE_ENV === "development") {
    console.warn(`[gig-categories] Unknown category normalized to "other":`, category);
  }
  
  return "other";
}

/**
 * Returns a human-readable label for a category
 * 
 * @param category - Category string from DB or user input (can be null/undefined)
 * @returns Display label (always returns a valid string)
 */
export function getCategoryLabel(category: CategoryInput): string {
  const c = normalizeGigCategory(category);
  return LABELS[c];
}

/**
 * Returns a badge variant key for shadcn/ui Badge component
 * Adjust variants to match your Badge component implementation
 * 
 * @param category - Category string from DB or user input (can be null/undefined)
 * @returns Badge variant key
 */
export function getCategoryBadgeVariant(category: CategoryInput): "default" | "secondary" | "outline" {
  const c = normalizeGigCategory(category);
  return BADGE_VARIANTS[c];
}

/**
 * Returns all DB category values that should match when filtering by a normalized category
 * Used for backward compatibility - includes both new and legacy values
 * 
 * @param category - Category string from DB or user input (can be null/undefined)
 * @returns Array of DB category strings that should match this normalized category
 *          Returns empty array for empty/null/undefined inputs (allows "no filter" behavior)
 */
export function getCategoryFilterSet(category: CategoryInput): string[] {
  const raw = String(category ?? "").trim();
  if (!raw) return []; // Empty array = no filtering constraint
  const c = normalizeGigCategory(raw);
  return CATEGORY_FILTER_SETS[c];
}
