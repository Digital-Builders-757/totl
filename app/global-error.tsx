"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // Filter out hydration errors from being sent to Sentry as they're often caused by browser extensions
    if (error.message.includes("hydrat") || error.message.includes("hydration")) {
      logger.info("Hydration error caught by global error boundary (not sent to Sentry)", {
        message: error.message,
      });
      // Don't send hydration errors to Sentry as they're usually not actionable
      return;
    }

    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
