/**
 * Opportunity (gig) cover image specifications
 * Used for upload notices and validation guidance across the app.
 */

/** Display aspect ratio for opportunity cards (matches aspect-4-3 in UI) */
export const OPPORTUNITY_IMAGE_ASPECT_RATIO = "4:3" as const;

/** Recommended pixel dimensions for best display (4:3) */
export const OPPORTUNITY_IMAGE_RECOMMENDED_WIDTH = 1200;
export const OPPORTUNITY_IMAGE_RECOMMENDED_HEIGHT = 900;

/** Minimum dimensions for acceptable quality */
export const OPPORTUNITY_IMAGE_MIN_WIDTH = 800;
export const OPPORTUNITY_IMAGE_MIN_HEIGHT = 600;

/** Human-readable spec string for UI notices */
export const OPPORTUNITY_IMAGE_SPEC_NOTICE =
  `${OPPORTUNITY_IMAGE_RECOMMENDED_WIDTH}×${OPPORTUNITY_IMAGE_RECOMMENDED_HEIGHT} px (4:3 aspect ratio)`;
