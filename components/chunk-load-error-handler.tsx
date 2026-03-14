"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";

const RELOAD_KEY = "stale_chunk_reload_ts";

function canReloadOncePerMinute(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    const now = Date.now();
    if (now - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
    return true;
  } catch {
    return true; // fail open
  }
}

/**
 * Handles chunk loading errors gracefully by retrying failed chunks
 * This is a common issue in Next.js development when hot reload fails
 */
export function ChunkLoadErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error;
      const msg = error?.message ?? "";

      // Stale webpack chunk (e.g. after deployment while user has old JS cached).
      // Next.js issue: f[e].call() where f[e] is undefined. Use exact message only;
      // do not match generic "reading 'call'" which can mask unrelated bugs.
      const isStaleWebpackChunk = msg.includes(
        "Cannot read properties of undefined (reading 'call')"
      );

      // Standard chunk loading errors
      const isChunkLoadError =
        msg.includes("Loading chunk") ||
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("chunk load failed") ||
        error?.name === "ChunkLoadError";

      if (isStaleWebpackChunk || isChunkLoadError) {
        const isProduction = process.env.NODE_ENV === "production";

        if (isProduction) {
          logger.warn(
            "[ChunkLoadErrorHandler] Chunk/stale-asset error detected, attempting recovery.",
            { isStaleWebpackChunk }
          );
        } else {
          logger.info(
            "[ChunkLoadErrorHandler] Chunk/stale-asset error detected, attempting recovery.",
            { isStaleWebpackChunk }
          );
        }

        const retryDelay = isStaleWebpackChunk ? 500 : 2000;

        setTimeout(() => {
          if (document.visibilityState === "visible") {
            if (isStaleWebpackChunk) {
              // Stale chunks require full reload to fetch new JS
              // Guard: max 1 reload per 60s to prevent infinite reload loops
              if (canReloadOncePerMinute()) {
                logger.info("[ChunkLoadErrorHandler] Full reload to recover from stale webpack chunks.");
                window.location.reload();
              }
            } else {
              logger.info("[ChunkLoadErrorHandler] Refreshing route to recover from chunk error.");
              router.refresh();
            }
          }
        }, retryDelay);

        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("error", handleChunkError);

    return () => {
      window.removeEventListener("error", handleChunkError);
    };
  }, [router]);

  return null; // This component doesn't render anything
}
