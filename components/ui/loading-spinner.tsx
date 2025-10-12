import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | string;
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  const sizeClass =
    typeof size === "string" && sizeClasses[size as keyof typeof sizeClasses]
      ? sizeClasses[size as keyof typeof sizeClasses]
      : sizeClasses.md;

  return <Loader2 className={cn(sizeClass, "animate-spin", className)} />;
}
