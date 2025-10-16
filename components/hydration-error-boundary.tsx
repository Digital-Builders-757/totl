"use client";

import { useEffect, useState } from "react";

interface HydrationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HydrationErrorBoundary({
  children,
  fallback = <div>Loading...</div>,
}: HydrationErrorBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Set hydrated to true after component mounts
    setIsHydrated(true);

    // Listen for hydration errors
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes("hydrat") || event.message.includes("hydration")) {
        console.warn("Hydration error detected, but continuing:", event.message);
        setHasError(true);
        // Don't prevent default - let React handle it
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  // Show fallback during hydration or if there's an error
  if (!isHydrated || hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
