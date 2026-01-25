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
 * Safely extracts error message and stack from unknown error types
 */
function extractErrorInfo(error: unknown): { message: string; error?: Error } {
  if (error instanceof Error) {
    return { message: error.message, error };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return { message: String(error) };
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
   * Use this for actual errors (Error objects or error messages)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog("error")) return;

    const { message: errorMessage, error: errorObj } = extractErrorInfo(error || message);
    const redactedContext = context ? redactSensitiveData(context) : undefined;

    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, errorObj || errorMessage, redactedContext);
    }

    // Send to Sentry - use exception if we have Error object, otherwise message
    if (errorObj) {
      Sentry.captureException(errorObj, {
        extra: {
          message,
          ...redactedContext,
        },
        level: "error",
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        extra: {
          errorMessage,
          ...redactedContext,
        },
      });
    }
  }
}

export const logger = new Logger();
