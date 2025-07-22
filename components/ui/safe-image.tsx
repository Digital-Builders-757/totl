"use client";

import Image from "next/image";
import { useState } from "react";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
  fallbackType?: "placeholder" | "static";
  placeholderQuery?: string;
}

/**
 * Safe image component that handles loading errors gracefully
 * @param src - Image source URL
 * @param alt - Alt text for accessibility
 * @param width - Image width
 * @param height - Image height
 * @param className - CSS classes
 * @param fallbackSrc - Fallback image source
 * @param fallbackType - "placeholder" uses dynamic placeholder, "static" uses fallbackSrc
 * @param placeholderQuery - Query string for placeholder image (e.g. "person", "landscape")
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className = "",
  fallbackSrc = "/images/totl-logo-transparent.png",
  fallbackType = "static",
  placeholderQuery = "image",
}: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (fallbackType === "static") {
        setImageSrc(fallbackSrc);
      } else {
        // For placeholder type, use a simple fallback
        setImageSrc(fallbackSrc);
      }
    }
  };

  // If no src provided, use fallback immediately
  if (!src) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={imageSrc || fallbackSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}
