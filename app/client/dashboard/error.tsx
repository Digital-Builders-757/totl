"use client";

import { RouteErrorFallback } from "@/components/errors/route-error-fallback";

export default function ClientDashboardError({
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
      title="Dashboard temporarily unavailable"
      description="We couldn’t load your Career Builder dashboard. Please try again — this is usually brief."
      logLabel="[client/dashboard]"
    />
  );
}
