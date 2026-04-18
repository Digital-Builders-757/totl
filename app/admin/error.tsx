"use client";

import { RouteErrorFallback } from "@/components/errors/route-error-fallback";

export default function AdminSegmentError({
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
      title="Admin area hit a snag"
      description="We couldn’t finish loading this admin screen. Try again, or return to the dashboard from the menu."
      logLabel="[admin]"
    />
  );
}
