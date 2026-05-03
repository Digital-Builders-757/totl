"use client";

import { RouteErrorFallback } from "@/components/errors/route-error-fallback";

export default function ClientGigsError({
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
      title="Your opportunities page is unavailable"
      description="We couldn't load your opportunities right now. Please try again."
      logLabel="[client/gigs]"
    />
  );
}

