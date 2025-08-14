"use client";

import Image from "next/image";
import { useState } from "react";
import { logImageFallback } from "@/lib/error-logger";

interface SafeImageProps {
  src: string;
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
  fallbackSrc = "/images/totl-logo.png",
  context = "unknown",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  placeholderQuery: _placeholderQuery,
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

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
