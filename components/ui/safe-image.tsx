"use client";

import Image from "next/image";
import { useState } from "react";
import { logImageFallback } from "@/lib/error-logger";

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  context?: string;
}

export function SafeImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
  fallbackSrc = "/placeholder.jpg",
  context = "unknown",
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

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized={imgSrc === fallbackSrc} // Don't optimize placeholder images
    />
  );
}
