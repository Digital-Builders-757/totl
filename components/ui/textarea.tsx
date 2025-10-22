import * as React from "react";

import { cn } from "@/lib/utils/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground md:text-sm",
          // Enhanced focus with glow
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0 focus-visible:border-white/40",
          "focus-visible:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
          // Smooth transitions
          "transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
