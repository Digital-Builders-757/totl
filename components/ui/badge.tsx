import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        
        // Application/Booking Status Variants
        pending: "border-transparent bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        accepted: "border-transparent bg-green-500/20 text-green-300 border-green-500/30",
        rejected: "border-transparent bg-red-500/20 text-red-300 border-red-500/30",
        completed: "border-transparent bg-blue-500/20 text-blue-300 border-blue-500/30",
        cancelled: "border-transparent bg-gray-500/20 text-gray-300 border-gray-500/30",
        
        // Gig Status Variants
        active: "border-transparent bg-green-500/20 text-green-300 border-green-500/30",
        inactive: "border-transparent bg-gray-500/20 text-gray-300 border-gray-500/30",
        closed: "border-transparent bg-red-500/20 text-red-300 border-red-500/30",
        
        // Special States
        new: "border-transparent bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse-glow",
        urgent: "border-transparent bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse",
        verified: "border-transparent bg-blue-500/20 text-blue-300 border-blue-500/30",
      },
      glow: {
        none: "",
        subtle: "shadow-sm",
        medium: "shadow-md hover:shadow-lg",
        strong: "shadow-lg hover:shadow-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      glow: "none",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

function Badge({ className, variant, glow, icon, pulse, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, glow }),
        pulse && "animate-pulse-glow",
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
