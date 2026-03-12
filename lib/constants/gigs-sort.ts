/**
 * Sort options for /gigs faceted search.
 */

export const GIGS_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "soonest", label: "Soonest date first" },
  { value: "pay_high", label: "Highest pay first" },
  { value: "pay_low", label: "Lowest pay first" },
] as const;

export type GigsSortValue = (typeof GIGS_SORT_OPTIONS)[number]["value"];
