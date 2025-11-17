import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/**
 * Server-side Sentry test endpoint
 * GET /api/test-sentry?type=error|message|exception
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get("type") || "message";

  try {
    switch (testType) {
      case "error": {
        // Throw an unhandled error (will be caught by Sentry's error handler)
        const testError = new Error("🧪 Server-side test error from TOTL Agency API");
        // Explicitly capture it to ensure it's sent
        Sentry.captureException(testError, {
          tags: {
            feature: "api-test",
            test: true,
            endpoint: "/api/test-sentry",
          },
          extra: {
            context: "Testing server-side Sentry error reporting",
            timestamp: new Date().toISOString(),
          },
          level: "error",
        });
        console.log("[Sentry Test] Error captured and sent to Sentry");
        throw testError;
      }

      case "exception":
        // Capture a handled exception
        try {
          throw new Error("Simulated server error: Database connection failed");
        } catch (error) {
          Sentry.captureException(error, {
            tags: {
              feature: "api-test",
              test: true,
              endpoint: "/api/test-sentry",
            },
            extra: {
              context: "Testing server-side Sentry integration",
              timestamp: new Date().toISOString(),
            },
            level: "error",
          });
          console.log("[Sentry Test] Exception captured and sent to Sentry");
        }
        return NextResponse.json({
          success: true,
          message: "Exception captured and sent to Sentry",
          testType: "exception",
        });

      case "message":
      default:
        // Send an info message
        Sentry.captureMessage("✅ Server-side test message: Sentry API integration working!", "info");
        console.log("[Sentry Test] Message sent to Sentry");
        return NextResponse.json({
          success: true,
          message: "Message sent to Sentry",
          testType: "message",
        });
    }
  } catch (error) {
    // Ensure error is captured by Sentry (in case automatic handler didn't catch it)
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          feature: "api-test",
          test: true,
          endpoint: "/api/test-sentry",
          caughtIn: "catch-block",
        },
        extra: {
          context: "Error caught in route handler catch block",
          timestamp: new Date().toISOString(),
        },
        level: "error",
      });
      console.log("[Sentry Test] Error caught and sent to Sentry from catch block");
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        testType: "error",
        note: "Error should appear in Sentry dashboard within a few seconds",
      },
      { status: 500 }
    );
  }
}

