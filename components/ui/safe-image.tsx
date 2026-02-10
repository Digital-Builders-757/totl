"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { logImageFallback } from "@/lib/utils/error-logger";
import { cn } from "@/lib/utils/utils";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  context?: string;
  showSkeleton?: boolean;
  priority?: boolean;
  /**
   * If true (default), treat known-blocked upstream hosts as fallback-first.
   * This prevents blank/black cards caused by predictable 403 hotlink blocks.
   */
  fallbackFirstOnBlockedHosts?: boolean;
  /** @deprecated Do not use. Ignored internally and blocked by ESLint. */
  placeholderQuery?: string;
}

export function SafeImage({
  src,
  alt,
  width = 400,
  height = 300,
  fill = false,
  className = "",
  fallbackSrc = "/images/solo_logo.png",
  context = "unknown",
  showSkeleton = true,
  priority = false,
  fallbackFirstOnBlockedHosts = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  placeholderQuery: _placeholderQuery,
}: SafeImageProps) {
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isProbablyBlockedUpstream = (url: string): boolean => {
    // These hosts commonly block Next/Image optimizer hotlinking (403).
    // We treat them as fallback-first to avoid black/blank cards.
    const blockedHostSubstrings = [
      "instagram.com",
      "cdninstagram.com",
      "fbcdn.net",
      "pixieset.com",
    ];

    try {
      const host = new URL(url).host.toLowerCase();
      return blockedHostSubstrings.some((s) => host.includes(s));
    } catch {
      return false;
    }
  };

  // Fallback-first cases: missing/empty/invalid/blocked upstream.
  const shouldUseFallback =
    !src ||
    src.trim() === "" ||
    (!src.startsWith("/") && !src.startsWith("http") && !src.startsWith("data:")) ||
    (src.startsWith("http") && !isValidUrl(src)) ||
    (fallbackFirstOnBlockedHosts && src.startsWith("http") && isProbablyBlockedUpstream(src));

  if (src && shouldUseFallback && src !== fallbackSrc) {
    // eslint-disable-next-line no-console
    console.warn(`SafeImage: fallback-first in ${context}`, {
      src,
      reason: !src
        ? "null/undefined"
        : src.trim() === ""
          ? "empty string"
          : (!src.startsWith("/") && !src.startsWith("http") && !src.startsWith("data:"))
            ? "invalid protocol"
            : src.startsWith("http") && !isValidUrl(src)
              ? "invalid URL format"
              : "blocked upstream host",
    });
  }

  const initialSrc = shouldUseFallback ? fallbackSrc : src;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(shouldUseFallback);
  const [isLoading, setIsLoading] = useState(!shouldUseFallback);

  useEffect(() => {
    const nextShouldUseFallback =
      !src ||
      src.trim() === "" ||
      (!src.startsWith("/") && !src.startsWith("http") && !src.startsWith("data:")) ||
      (src.startsWith("http") && !isValidUrl(src)) ||
      (fallbackFirstOnBlockedHosts && src.startsWith("http") && isProbablyBlockedUpstream(src));

    const nextSrc = nextShouldUseFallback ? fallbackSrc : src;

    setHasError(nextShouldUseFallback);
    setImgSrc(nextSrc);
    setIsLoading(!nextShouldUseFallback);
  }, [src, fallbackSrc, fallbackFirstOnBlockedHosts]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      setIsLoading(false);
      if (src && src !== fallbackSrc) {
        logImageFallback(src, context);
      }
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const imageClasses = cn(
    "transition-opacity duration-500",
    isLoading ? "opacity-0" : "opacity-100",
    className
  );

  if (fill) {
    return (
      <div className="relative w-full h-full">
        {showSkeleton && isLoading && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-none bg-zinc-800/50" />
        )}
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={imageClasses}
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={imgSrc === fallbackSrc}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {showSkeleton && isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full bg-zinc-800/50" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={imageClasses}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={imgSrc === fallbackSrc}
        priority={priority}
      />
    </div>
  );
}
