"use client";

import "./globals.css";

import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (error.message.includes("hydrat") || error.message.includes("hydration")) {
      logger.info("Hydration error caught by global error boundary (not sent to Sentry)", {
        message: error.message,
      });
      return;
    }

    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              We hit an unexpected issue loading this page. Your account and data are safe. Try
              refreshing — most problems clear up right away.
            </p>
            {error.digest ? (
              <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Reference: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Refresh page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
