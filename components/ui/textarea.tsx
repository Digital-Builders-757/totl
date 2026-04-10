import * as React from "react";

import { cn } from "@/lib/utils/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "totl-input-shell totl-focus-ring flex min-h-[96px] w-full rounded-xl px-3 py-2 text-base text-foreground placeholder:text-muted-foreground md:text-sm",
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
