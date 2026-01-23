/**
 * Talent Type Detection Utility
 * 
 * Determines if a talent is modeling-focused based on their specialties array.
 * Used to conditionally show/hide modeling-specific profile fields.
 */

const MODELING_TOKENS = new Set([
  "modeling",
  "modelling", // British spelling
  "model",
  "runway",
  "editorial",
  "commercial",
  "print",
  "beauty",
  "fitness",
]);

/**
 * Checks if a talent's specialties indicate they are modeling-focused.
 * 
 * @param specialties - Array of specialty strings (can be null/undefined)
 * @returns true if specialties include any modeling-related terms
 * 
 * @example
 * isModelingTalent(["modeling", "photography"]) // true
 * isModelingTalent(["photography", "video"]) // false
 * isModelingTalent(null) // false
 */
export function isModelingTalent(
  specialties: string[] | null | undefined
): boolean {
  if (!specialties?.length) return false;
  
  return specialties.some((s) => {
    const normalized = String(s).trim().toLowerCase();
    return MODELING_TOKENS.has(normalized);
  });
}
