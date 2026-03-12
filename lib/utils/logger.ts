// Production-ready logger utility with Sentry integration
// Replaces console.log/debug/warn/error with structured logging

import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

/**
 * Redacts sensitive data from context objects
 * Prevents accidental token/header exposure in Sentry
 */
function redactSensitiveData(context: LogContext): LogContext {
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
    "apikey",
    "api_key",
    "stripe_secret",
    "supabase_key",
    "service_role_key",
  ];

  const redacted = { ...context };

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(redacted[key] as LogContext);
    }
  }

  return redacted;
}

/**
 * Normalizes unknown into a real Error for Sentry exception capture.
 * Supabase errors (PostgrestError, AuthError) are often not instanceof Error;
 * wrapping them preserves stack traces and structured detail in Sentry.
 */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    const msg =
      typeof anyErr.message === "string"
        ? anyErr.message
        : "Non-Error thrown";

    const e = new Error(msg);
    (e as Error & { cause?: unknown }).cause = err;
    return e;
  }
  return new Error(String(err));
}

/**
 * Extracts safe, serializable fields from error-like objects for Sentry extra.
 * Avoids "[object Object]" and circular reference issues.
 */
function safeExtraFromError(err: unknown): Record<string, unknown> {
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    const extra: Record<string, unknown> = {};
    if (typeof anyErr.message === "string") extra.originalMessage = anyErr.message;
    if (typeof anyErr.code === "string") extra.code = anyErr.code;
    if (typeof anyErr.details === "string") extra.details = anyErr.details;
    if (typeof anyErr.hint === "string") extra.hint = anyErr.hint;
    if (typeof anyErr.status === "number") extra.status = anyErr.status;
    return extra;
  }
  return { raw: String(err) };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // Production: only warn and error (no debug/info noise)
    return level === "warn" || level === "error";
  }

  /**
   * Debug logs - development only, never sent to Sentry
   */
  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog("debug")) return;
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info logs - development only, never sent to Sentry
   */
  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog("info")) return;
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning logs - sent to Sentry in production
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog("warn")) return;

    const redactedContext = context ? redactSensitiveData(context) : undefined;

    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, redactedContext);
    }

    // Send to Sentry as message (not exception)
    Sentry.captureMessage(message, {
      level: "warning",
      extra: redactedContext,
    });
  }

  /**
   * Error logs - always sent to Sentry
   * Use this for actual errors (Error objects, Supabase errors, or error messages).
   * Normalizes non-Error throwables (PostgrestError, AuthError) into proper exceptions
   * so Sentry gets stack traces and structured detail.
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog("error")) return;

    const normalizedError = toError(error ?? message);
    const redactedContext = context ? redactSensitiveData(context) : undefined;
    const errorExtra = error !== undefined && error !== null ? safeExtraFromError(error) : {};

    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, normalizedError, redactedContext);
    }

    // Always capture as exception for full stack trace and grouping
    Sentry.captureException(normalizedError, {
      extra: {
        message,
        ...errorExtra,
        ...redactedContext,
      },
      level: "error",
    });
  }
}

export const logger = new Logger();
