/**
 * Canonical implementation lives in `@/lib/utils/error-logger`.
 * Re-export so docs and older references to `@/lib/error-logger` stay valid.
 */
export {
  errorLogger,
  logAnalytics,
  logEmptyState,
  logError,
  logFallbackUsage,
  logImageFallback,
} from "@/lib/utils/error-logger";
export type { AnalyticsEvent, ErrorLogData } from "@/lib/utils/error-logger";
