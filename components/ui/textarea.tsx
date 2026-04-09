import * as React from "react";

import { cn } from "@/lib/utils/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input/85 bg-background/55 px-3 py-2 text-base text-foreground shadow-sm backdrop-blur-sm placeholder:text-muted-foreground md:text-sm",
          "transition-[box-shadow,border-color,background-color] duration-200",
          "focus-visible:outline-none focus-glow",
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
