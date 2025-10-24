"use client";

import Image from "next/image";
import { useState } from "react";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  placeholderQuery: _placeholderQuery,
}: SafeImageProps) {
  // Validate URL format before using it
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle empty strings, null values, and invalid URLs by using fallback immediately
  const shouldUseFallback = !src || 
    src.trim() === "" || 
    (!src.startsWith('/') && !src.startsWith('http') && !src.startsWith('data:')) ||
    (src.startsWith('http') && !isValidUrl(src));
  
  // Debug logging for invalid URLs
  if (src && shouldUseFallback && src !== fallbackSrc) {
    console.warn(`SafeImage: Invalid URL detected in ${context}:`, {
      src,
      reason: !src ? 'null/undefined' : 
              src.trim() === "" ? 'empty string' :
              (!src.startsWith('/') && !src.startsWith('http') && !src.startsWith('data:')) ? 'invalid protocol' :
              'invalid URL format'
    });
  }
  
  const initialSrc = shouldUseFallback ? fallbackSrc : src;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(shouldUseFallback);
  const [isLoading, setIsLoading] = useState(true);

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
