// Error logging and analytics utility for production monitoring

export interface ErrorLogData {
  error: string;
  context: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  timestamp: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLogData[] = [];
  private analytics: AnalyticsEvent[] = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(error: string, context: string, userId?: string): void {
    const logData: ErrorLogData = {
      error,
      context,
      userId,

      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    };

    this.logs.push(logData);

    // In production, you'd send this to your logging service
    if (process.env.NODE_ENV === "development") {
      console.error("🚨 Error Logged:", logData);
    }

    // You could also send to Supabase, Sentry, or other services here
  }

  logAnalytics(
    event: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    userId?: string
  ): void {
    const analyticsData: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      userId,
      timestamp: new Date().toISOString(),
    };

    this.analytics.push(analyticsData);

    // In production, you'd send this to your analytics service
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics Event:", analyticsData);
    }
  }

  logEmptyState(context: string, userId?: string): void {
    this.logAnalytics("empty_state", "user_experience", "displayed", context, 1, userId);
  }

  logFallbackUsage(fallbackType: string, context: string, userId?: string): void {
    this.logAnalytics(
      "fallback_used",
      "user_experience",
      "displayed",
      `${fallbackType}_in_${context}`,
      1,
      userId
    );
  }

  logImageFallback(imagePath: string, context: string): void {
    // Only log in development if it's not a known fallback case
    if (process.env.NODE_ENV === "development" && !imagePath.includes("picsum.photos")) {
      this.logError(`Image not found: ${imagePath}`, context);
    }
    this.logAnalytics("image_fallback", "assets", "displayed", imagePath);
  }

  getLogs(): ErrorLogData[] {
    return this.logs;
  }

  getAnalytics(): AnalyticsEvent[] {
    return this.analytics;
  }

  clearLogs(): void {
    this.logs = [];
    this.analytics = [];
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Convenience functions
export const logError = (error: string, context: string, userId?: string) => {
  errorLogger.logError(error, context, userId);
};

export const logAnalytics = (
  event: string,
  category: string,
  action: string,
  label?: string,
  value?: number,
  userId?: string
) => {
  errorLogger.logAnalytics(event, category, action, label, value, userId);
};

export const logEmptyState = (context: string, userId?: string) => {
  errorLogger.logEmptyState(context, userId);
};

export const logFallbackUsage = (fallbackType: string, context: string, userId?: string) => {
  errorLogger.logFallbackUsage(fallbackType, context, userId);
};

export const logImageFallback = (imagePath: string, context: string) => {
  errorLogger.logImageFallback(imagePath, context);
};
