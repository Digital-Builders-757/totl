import type React from "react";

import { cn } from "@/lib/utils/utils";

interface TotlAtmosphereShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  contentClassName?: string;
  withGrid?: boolean;
  withNoise?: boolean;
}

export function TotlAtmosphereShell({
  children,
  className,
  contentClassName,
  withGrid = true,
  withNoise = true,
  ...props
}: TotlAtmosphereShellProps) {
  return (
    <div className={cn("totl-atmosphere-shell", className)} {...props}>
      <div className="totl-atmosphere-layer totl-atmosphere-base" aria-hidden />
      <div className="totl-atmosphere-layer totl-atmosphere-glow" aria-hidden />
      {withGrid ? <div className="totl-atmosphere-layer totl-atmosphere-grid" aria-hidden /> : null}
      {withNoise ? <div className="totl-atmosphere-layer totl-atmosphere-noise" aria-hidden /> : null}
      <div className={cn("relative z-[2] min-h-[100dvh]", contentClassName)}>{children}</div>
    </div>
  );
}
