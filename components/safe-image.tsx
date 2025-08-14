"use client";

import Image from "next/image";
import { useState } from "react";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  fallbackType?: "placeholder" | "static";
  /** @deprecated Do not use. Ignored internally and blocked by ESLint. */
  placeholderQuery?: string;
}

/**
 * Safe image component that handles loading errors gracefully
 * @param src - Image source URL
 * @param alt - Alt text for accessibility
 * @param width - Image width (required if fill is false)
 * @param height - Image height (required if fill is false)
 * @param fill - Whether to use fill mode (requires parent with relative positioning)
 * @param className - CSS classes
 * @param fallbackSrc - Fallback image source
 * @param fallbackType - "placeholder" uses dynamic placeholder, "static" uses fallbackSrc

 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  fallbackSrc = "/images/totl-logo-transparent.png",
  fallbackType = "static",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  placeholderQuery: _placeholderQuery,
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

  // Validate props
  if (!fill && (!width || !height)) {
    console.warn("SafeImage: width and height are required when fill is false");
    return null;
  }

  // If no src provided, use fallback immediately
  if (!src) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
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
      fill={fill}
      className={className}
      onError={handleError}
    />
  );
}
