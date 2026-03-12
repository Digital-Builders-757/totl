/**
 * Build /gigs URL from saved search params.
 */
import type { SavedSearchParams } from "@/lib/actions/saved-search-actions";

export function buildGigsUrl(params: SavedSearchParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.location) search.set("location", params.location);
  if (params.radius_miles) search.set("radius_miles", params.radius_miles);
  if (params.compensation) search.set("compensation", params.compensation);
  if (params.pay_range) search.set("pay_range", params.pay_range);
  if (params.upcoming) search.set("upcoming", "1");
  if (params.local_date && /^\d{4}-\d{2}-\d{2}$/.test(params.local_date)) {
    search.set("local_date", params.local_date);
  }
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  search.set("page", "1");
  const qs = search.toString();
  return qs ? `/gigs?${qs}` : "/gigs";
}
