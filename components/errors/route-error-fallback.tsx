"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/utils/logger";

export interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
  /** Log prefix e.g. `[client/dashboard]` */
  logLabel: string;
}

export function RouteErrorFallback({
  error,
  reset,
  title,
  description,
  logLabel,
}: RouteErrorFallbackProps) {
  useEffect(() => {
    logger.error(`${logLabel} route error boundary`, error, {
      digest: error.digest,
    });
  }, [error, logLabel]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.digest ? (
            <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
          <Button onClick={reset} className="w-full" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
