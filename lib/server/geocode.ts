import "server-only";
import { logger } from "@/lib/utils/logger";

/**
 * Geocode a location string to lat/lng using Nominatim (OpenStreetMap).
 * Free, rate-limited (1 req/sec). For production, consider Mapbox/Google.
 */
export async function geocode(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = location.trim();
  if (!trimmed) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "TOTL-Agency/1.0 (contact@totl.com)" },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) {
      logger.warn("Geocoding request failed", { status: res.status, location: trimmed });
      return null;
    }

    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch (err) {
    logger.error("Geocoding error", err, { location: trimmed });
    return null;
  }
}

/** Convert miles to meters for PostGIS ST_DWithin */
export function milesToMeters(miles: number): number {
  return miles * 1609.344;
}
