"use client";

import { Check, AlertCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/utils";

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  showValidationIcon?: boolean;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, success, showValidationIcon = true, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const isFloating = isFocused || hasValue || props.value || props.defaultValue;
    const hasError = !!error;

    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            type={type}
            className={cn(
              // Base styles
              "peer w-full rounded-lg border bg-background px-4 pt-6 pb-2 text-sm transition-all duration-200",
              // Focus styles with glow
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              // Default state
              !hasError && !success && "border-zinc-700 focus-visible:ring-white/20 focus-visible:border-white/40",
              // Error state
              hasError && "border-red-500/50 focus-visible:ring-red-500/30 focus-visible:border-red-500 animate-shake",
              // Success state
              success && "border-green-500/50 focus-visible:ring-green-500/30 focus-visible:border-green-500",
              // Disabled state
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Focus glow effect
              "focus-visible:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder=" "
            {...props}
          />
          
          {/* Floating Label */}
          {label && (
            <label
              className={cn(
                "absolute left-4 transition-all duration-200 pointer-events-none",
                "text-zinc-400",
                isFloating
                  ? "top-2 text-xs font-medium"
                  : "top-1/2 -translate-y-1/2 text-sm",
                hasError && "text-red-400",
                success && "text-green-400"
              )}
            >
              {label}
            </label>
          )}

          {/* Validation Icons */}
          {showValidationIcon && (success || hasError) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {success && (
                <Check className="h-5 w-5 text-green-500 animate-scale-in" />
              )}
              {hasError && (
                <AlertCircle className="h-5 w-5 text-red-500 animate-scale-in" />
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {hasError && error && (
          <p className="mt-1.5 text-xs text-red-400 animate-slide-down">
            {error}
          </p>
        )}
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };

