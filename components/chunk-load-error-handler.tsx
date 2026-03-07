"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";

/**
 * Handles chunk loading errors gracefully by retrying failed chunks
 * This is a common issue in Next.js development when hot reload fails
 */
export function ChunkLoadErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if it's a chunk loading error
      if (
        error?.message?.includes("Loading chunk") ||
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("chunk load failed") ||
        error?.name === "ChunkLoadError"
      ) {
        logger.warn("[ChunkLoadErrorHandler] Chunk loading error detected, attempting recovery.");
        
        // Try to refresh route data after a short delay.
        // This keeps SPA navigation semantics instead of forcing a full document reload.
        const retryDelay = 2000; // 2 seconds
        
        setTimeout(() => {
          // Only refresh if we're still on the same page (user hasn't navigated away)
          if (document.visibilityState === "visible") {
            logger.info("[ChunkLoadErrorHandler] Refreshing route to recover from chunk error.");
            router.refresh();
          }
        }, retryDelay);
      }
    };

    // Listen for unhandled errors
    window.addEventListener("error", handleChunkError);

    return () => {
      window.removeEventListener("error", handleChunkError);
    };
  }, [router]);

  return null; // This component doesn't render anything
}
