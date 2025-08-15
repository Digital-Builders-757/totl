import { User } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

// Standard shadcn/ui Avatar component
const Avatar = React.forwardRef<React.ElementRef<"div">, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

export { Avatar };

// Add the missing exports for shadcn/ui compatibility
export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  asChild?: boolean;
}

export function AvatarImage({ className, alt, ...props }: AvatarImageProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      className={cn("aspect-square h-full w-full object-cover", className)}
      alt={alt}
      {...props}
    />
  );
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-500",
        className
      )}
      {...props}
    >
      {children || <User className="h-6 w-6" />}
    </div>
  );
}
