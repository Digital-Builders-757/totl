import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
  fallbackType?: "placeholder" | "static";
  placeholderQuery?: string;
};

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
  fallbackSrc = "/placeholder.jpg",
  fallbackType = "placeholder",
  placeholderQuery = "image",
  width,
  height,
  fill,
  className,
  ...props
}: SafeImageProps) {
  // Check if src is valid (not undefined, null, or empty string)
  const isValidSrc = src && src.trim() !== "";

  // Determine the image source based on fallback type
  let imageSrc: string;

  if (isValidSrc) {
    imageSrc = src as string;
  } else if (fallbackType === "placeholder") {
    // Create a dynamic placeholder with appropriate dimensions
    const w = width || 400;
    const h = height || 400;
    imageSrc = `/placeholder.svg?height=${h}&width=${w}&query=${placeholderQuery}`;
  } else {
    // Use the provided static fallback
    imageSrc = fallbackSrc;
  }

  return (
    <div className={cn("overflow-hidden", fill ? "relative w-full h-full" : "", className)}>
      <Image
        src={imageSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={cn("object-cover", className)}
        {...props}
      />
    </div>
  );
}
