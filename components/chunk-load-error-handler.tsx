"use client";

import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";

/**
 * Handles chunk loading errors gracefully by retrying failed chunks
 * This is a common issue in Next.js development when hot reload fails
 */
export function ChunkLoadErrorHandler() {
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
        
        // Try to reload the page after a short delay
        // This is often caused by hot reload issues and a refresh fixes it
        const retryDelay = 2000; // 2 seconds
        
        setTimeout(() => {
          // Only reload if we're still on the same page (user hasn't navigated away)
          if (document.visibilityState === "visible") {
            logger.info("[ChunkLoadErrorHandler] Reloading page to recover from chunk error.");
            window.location.reload();
          }
        }, retryDelay);
      }
    };

    // Listen for unhandled errors
    window.addEventListener("error", handleChunkError);

    return () => {
      window.removeEventListener("error", handleChunkError);
    };
  }, []);

  return null; // This component doesn't render anything
}
