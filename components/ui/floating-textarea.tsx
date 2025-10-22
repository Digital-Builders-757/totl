"use client";

import { AlertCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils/utils";

export interface FloatingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showValidationIcon?: boolean;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, error, showValidationIcon = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const isFloating = isFocused || hasValue || props.value || props.defaultValue;
    const hasError = !!error;

    return (
      <div className="relative w-full">
        <div className="relative">
          <textarea
            className={cn(
              // Base styles
              "peer w-full rounded-lg border bg-background px-4 pt-6 pb-2 text-sm transition-all duration-200 min-h-[120px] resize-y",
              // Focus styles with glow
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              // Default state
              !hasError && "border-zinc-700 focus-visible:ring-white/20 focus-visible:border-white/40",
              // Error state
              hasError && "border-red-500/50 focus-visible:ring-red-500/30 focus-visible:border-red-500 animate-shake",
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
                  : "top-6 text-sm",
                hasError && "text-red-400"
              )}
            >
              {label}
            </label>
          )}

          {/* Validation Icon */}
          {showValidationIcon && hasError && (
            <div className="absolute right-3 top-6">
              <AlertCircle className="h-5 w-5 text-red-500 animate-scale-in" />
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
FloatingTextarea.displayName = "FloatingTextarea";

export { FloatingTextarea };

