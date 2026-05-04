import type React from "react";

import { cn } from "@/lib/utils/utils";

/** Native section props forwarded (e.g. `aria-labelledby`). */
export type TotlEditorialSectionProps = React.ComponentPropsWithoutRef<"section">;

/**
 * Section-level editorial spotlight: soft canopy wash + faint horizon line (`::before` / `::after` in `globals.css`).
 * CSS-only, compositor-friendly opacity pulse — use for hero bands on marketing and high-traffic list pages.
 */
export function TotlEditorialSection({
  children,
  className,
  ...props
}: TotlEditorialSectionProps) {
  return (
    <section className={cn("totl-editorial-canopy", className)} {...props}>
      {children}
    </section>
  );
}
