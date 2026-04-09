"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary/95 text-primary-foreground shadow-sm hover:bg-primary/88 active:scale-[0.98] button-glow focus-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] focus-glow",
        outline:
          "border border-input bg-background/55 text-foreground shadow-sm backdrop-blur-sm hover:bg-accent/90 hover:text-accent-foreground active:scale-[0.98] focus-glow",
        secondary:
          "border border-border/45 bg-secondary/90 text-secondary-foreground shadow-sm hover:bg-secondary/75 active:scale-[0.98] focus-glow",
        ghost: "hover:bg-accent/85 hover:text-accent-foreground active:scale-[0.98] focus-glow",
        link: "text-primary underline-offset-4 hover:underline focus-glow",
        success: "bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] focus-glow",
      },
      size: {
        // Normalize to 40px min touch target across standard controls.
        default: "h-10 min-h-10 px-4 py-2",
        sm: "h-10 min-h-10 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, success, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Determine the actual variant to use
    const actualVariant = success ? "success" : variant;
    
    // Button is disabled if explicitly disabled, loading, or in success state
    const isDisabled = disabled || loading || success;
    
    // When using asChild, we can't modify children structure (Slot requires single React element)
    // So ignore loading/success states when asChild is true
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant: actualVariant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant: actualVariant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        )}
        {success && !loading && (
          <>
            <Check className="h-4 w-4 animate-scale-in" />
            {children}
          </>
        )}
        {!loading && !success && children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
