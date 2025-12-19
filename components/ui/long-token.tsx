import * as React from "react";

import { cn } from "@/lib/utils/utils";

type LongTokenElement = "span" | "p" | "code" | "strong" | "div" | "a";

export type LongTokenProps<T extends LongTokenElement = "span"> = {
  /** Render element type. Defaults to "span". */
  as?: T;
  /** The long token string (UUID/email/url/etc). */
  value: string;
  /**
   * Defaults are optimized to prevent horizontal overflow on mobile.
   * Override with className as needed for styling consistency.
   */
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "children" | "className">;

export function LongToken<T extends LongTokenElement = "span">({
  as,
  value,
  className,
  title,
  ...props
}: LongTokenProps<T>) {
  const Comp = (as ?? "span") as React.ElementType;

  return (
    <Comp
      className={cn("break-all max-w-full", className)}
      title={title ?? value}
      {...props}
    >
      {value}
    </Comp>
  );
}

