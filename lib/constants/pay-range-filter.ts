/**
 * Pay range filter options for /gigs faceted search.
 * Uses gigs.compensation_numeric (extracted from compensation text).
 */

export const PAY_RANGE_OPTIONS = [
  { value: "", label: "Any pay range" },
  { value: "under_500", label: "Under $500" },
  { value: "500_1000", label: "$500 – $1,000" },
  { value: "1000_2500", label: "$1,000 – $2,500" },
  { value: "2500_5000", label: "$2,500 – $5,000" },
  { value: "5000_plus", label: "$5,000+" },
] as const;

export type PayRangeValue = (typeof PAY_RANGE_OPTIONS)[number]["value"];

export interface PayRangeBounds {
  min?: number;
  max?: number;
}

/**
 * Returns min/max bounds for a pay range filter value.
 * Used to build Supabase .gte() / .lte() filters.
 */
export function getPayRangeBounds(value: PayRangeValue): PayRangeBounds | null {
  switch (value) {
    case "under_500":
      return { max: 499.99 };
    case "500_1000":
      return { min: 500, max: 1000 };
    case "1000_2500":
      return { min: 1000, max: 2500 };
    case "2500_5000":
      return { min: 2500, max: 5000 };
    case "5000_plus":
      return { min: 5000 };
    default:
      return null;
  }
}
