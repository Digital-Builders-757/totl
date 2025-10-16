"use client";

import Image from "next/image";
import { useState } from "react";
import { logImageFallback } from "@/lib/utils/error-logger";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  context?: string;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  placeholderQuery: _placeholderQuery,
}: SafeImageProps) {
  // Handle empty strings and null values by using fallback immediately
  const initialSrc = src && src.trim() !== "" ? src : fallbackSrc;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(src === "" || !src || src.trim() === "");

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      logImageFallback(src, context);
    }
  };

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={className}
        onError={handleError}
        unoptimized={imgSrc === fallbackSrc}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized={imgSrc === fallbackSrc}
    />
  );
}
