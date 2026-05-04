"use client";

import { RouteErrorFallback } from "@/components/errors/route-error-fallback";

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="We hit a temporary issue"
      description="This page couldn't finish loading. Please try again."
      logLabel="[app]"
    />
  );
}

