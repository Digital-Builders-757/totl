import { logger } from "@/lib/utils/logger";

type LogContext = Record<string, unknown>;

/**
 * Consistent structured logging for mutation / action failures.
 * Prefer a dotted `flow` name: e.g. `admin.users.delete`, `bookings.load`.
 */
export function logActionFailure(flow: string, err: unknown, context?: LogContext): void {
  logger.error(`[${flow}] action failed`, err, { flow, ...context });
}
