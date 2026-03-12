/**
 * Whitelist and sanitize saved search params.
 * Prevents junk/oversized payloads and keeps the table future-proof.
 */

import type { GigsSortValue } from "@/lib/constants/gigs-sort";
import { GIGS_SORT_OPTIONS } from "@/lib/constants/gigs-sort";
import type { PayRangeValue } from "@/lib/constants/pay-range-filter";
import { PAY_RANGE_OPTIONS } from "@/lib/constants/pay-range-filter";
import { RADIUS_OPTIONS } from "@/lib/constants/radius-filter";

const ALLOWED_KEYS = [
  "q",
  "category",
  "location",
  "radius_miles",
  "compensation",
  "pay_range",
  "upcoming",
  "local_date",
  "sort",
] as const;

const STRING_LIMITS: Record<string, number> = {
  q: 200,
  category: 100,
  location: 200,
  compensation: 100,
  local_date: 10,
  sort: 20,
};

const VALID_PAY_RANGE = new Set<string>(
  PAY_RANGE_OPTIONS.map((o) => o.value).filter(Boolean) as string[]
);
const VALID_SORT = new Set<string>(GIGS_SORT_OPTIONS.map((o) => o.value) as string[]);
const VALID_RADIUS = new Set<string>(
  RADIUS_OPTIONS.map((o) => o.value).filter(Boolean) as string[]
);

export interface SavedSearchParams {
  q?: string;
  category?: string;
  location?: string;
  radius_miles?: string;
  compensation?: string;
  pay_range?: PayRangeValue;
  upcoming?: boolean;
  local_date?: string;
  sort?: GigsSortValue;
}

/**
 * Sanitize raw params from client or DB.
 * - Drops unknown keys
 * - Caps string lengths
 * - Validates pay_range and sort against allowed values
 * - Validates local_date as YYYY-MM-DD
 */
export function sanitizeSavedSearchParams(raw: unknown): SavedSearchParams {
  if (!raw || typeof raw !== "object") return {};

  const obj = raw as Record<string, unknown>;
  const out: SavedSearchParams = {};

  for (const key of ALLOWED_KEYS) {
    const val = obj[key];
    if (val === undefined || val === null) continue;

    switch (key) {
      case "upcoming":
        out.upcoming = val === true || val === "1" || val === "true";
        break;
      case "pay_range":
        if (typeof val === "string" && VALID_PAY_RANGE.has(val)) {
          out.pay_range = val as PayRangeValue;
        }
        break;
      case "sort":
        if (typeof val === "string" && VALID_SORT.has(val)) {
          out.sort = val as GigsSortValue;
        }
        break;
      case "radius_miles":
        if (typeof val === "string" && VALID_RADIUS.has(val)) {
          out.radius_miles = val;
        }
        break;
      case "local_date":
        if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          out.local_date = val.slice(0, 10);
        }
        break;
      default: {
        if (typeof val === "string") {
          const limit = STRING_LIMITS[key] ?? 200;
          const trimmed = val.slice(0, limit).trim() || undefined;
          if (key === "q") out.q = trimmed;
          else if (key === "category") out.category = trimmed;
          else if (key === "location") out.location = trimmed;
          else if (key === "compensation") out.compensation = trimmed;
        }
        break;
      }
    }
  }

  return out;
}
