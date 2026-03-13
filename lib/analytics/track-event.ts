/**
 * GA4 custom event tracking utility.
 * Only sends events when consent is granted and GA is enabled.
 * Fails silently if any check fails (non-blocking).
 */

const CONSENT_STORAGE_KEY =
  process.env.NEXT_PUBLIC_GA_CONSENT_KEY || "totl_ga_consent";
const GA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GA === "1";
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Track a custom GA4 event. No-op if GA disabled, consent not granted, or SSR.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;
  if (!GA_ENABLED || !MEASUREMENT_ID) return;

  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored !== "granted") return;

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params ?? {});
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(["event", eventName, params ?? {}]);
    }
  } catch {
    // Non-blocking: never throw
  }
}
