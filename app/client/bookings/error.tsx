"use client";

import { RouteErrorFallback } from "@/components/errors/route-error-fallback";

export default function ClientBookingsRouteError({
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
      title="Bookings couldn’t load"
      description="We couldn’t load your bookings right now. Please try again in a moment."
      logLabel="[client/bookings]"
    />
  );
}
