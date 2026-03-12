/**
 * Radius filter options for /gigs faceted search (PostGIS).
 * "Within X miles of [location]"
 */

export const RADIUS_OPTIONS = [
  { value: "", label: "No radius (text search)" },
  { value: "10", label: "Within 10 miles" },
  { value: "25", label: "Within 25 miles" },
  { value: "50", label: "Within 50 miles" },
  { value: "100", label: "Within 100 miles" },
] as const;

export type RadiusValue = (typeof RADIUS_OPTIONS)[number]["value"];
