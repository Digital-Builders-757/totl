"use client";

import { RouteErrorFallback } from "@/components/errors/route-error-fallback";

export default function GigsRouteError({
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
      title="Opportunities are temporarily unavailable"
      description="We couldn't load gigs right now. Please try again."
      logLabel="[gigs]"
    />
  );
}

