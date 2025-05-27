import type * as React from "react"
import { User } from "lucide-react"
import { SafeImage } from "./safe-image"
import { cn } from "@/lib/utils"

// Original Avatar component
type AvatarProps = {
  src?: string | null
  alt: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  // Define sizes
  const sizes = {
    sm: {
      container: "h-8 w-8",
      icon: "h-4 w-4",
    },
    md: {
      container: "h-10 w-10",
      icon: "h-5 w-5",
    },
    lg: {
      container: "h-12 w-12",
      icon: "h-6 w-6",
    },
    xl: {
      container: "h-16 w-16",
      icon: "h-8 w-8",
    },
  }

  const sizeClass = sizes[size].container
  const iconSize = sizes[size].icon

  return (
    <div className={cn("relative rounded-full overflow-hidden bg-gray-200", sizeClass, className)}>
      {src ? (
        <SafeImage src={src} alt={alt} fill placeholderQuery="person" className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500">
          <User className={iconSize} />
        </div>
      )}
    </div>
  )
}

// Add the missing exports for shadcn/ui compatibility
export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  asChild?: boolean
}

export function AvatarImage({ className, alt, ...props }: AvatarImageProps) {
  return <img className={cn("aspect-square h-full w-full object-cover", className)} alt={alt} {...props} />
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-500", className)}
      {...props}
    >
      {children || <User className="h-6 w-6" />}
    </div>
  )
}
