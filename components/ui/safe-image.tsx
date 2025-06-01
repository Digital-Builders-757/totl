"use client"

import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"
import { useState } from "react"

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null
  fallbackSrc?: string
  fallbackType?: "placeholder" | "static"
  placeholderQuery?: string
}

/**
 * SafeImage component that handles empty or null image sources gracefully
 *
 * @param src - The image source URL (can be undefined, null, or empty string)
 * @param alt - Alt text for the image
 * @param fallbackSrc - Optional custom fallback image
 * @param fallbackType - "placeholder" uses dynamic placeholder, "static" uses fallbackSrc
 * @param placeholderQuery - Query string for placeholder image (e.g. "person", "landscape")
 * @param ...props - All other Image props (width, height, className, etc.)
 */
export function SafeImage({
  src,
  alt,
  fallbackSrc,
  fallbackType = "placeholder",
  placeholderQuery = "image",
  width,
  height,
  fill,
  className,
  ...props
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if src is valid (not undefined, null, or empty string)
  const isValidSrc = src && src.trim() !== "" && !imageError

  // Determine the image source based on fallback type
  let imageSrc: string

  if (isValidSrc) {
    imageSrc = src as string
  } else if (fallbackType === "placeholder") {
    // Create a dynamic placeholder with appropriate dimensions
    const w = width || 400
    const h = height || 400
    imageSrc = `/placeholder.svg?height=${h}&width=${w}&query=${encodeURIComponent(placeholderQuery)}`
  } else {
    // Use the provided static fallback or default
    imageSrc =
      fallbackSrc ||
      "/placeholder.jpg"
  }

  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
    console.warn("SafeImage: Failed to load image", { src, fallbackType, fallbackSrc })
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={cn("overflow-hidden bg-gray-100 relative", fill ? "w-full h-full" : "", className)}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={cn(
          "object-cover transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
