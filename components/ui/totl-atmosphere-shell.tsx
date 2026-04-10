import type React from "react";

import { cn } from "@/lib/utils/utils";

export type TotlAmbientTone = "default" | "lifted";
export type TotlRouteRole = "talent" | "client" | "admin";

interface TotlAtmosphereShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  contentClassName?: string;
  withGrid?: boolean;
  withNoise?: boolean;
  /** Slightly brighter ambient stack for long forms (applications, onboarding). */
  ambientTone?: TotlAmbientTone;
  /** Sets `data-role` for inherited spotlight / token tuning (use on routes outside role layouts). */
  routeRole?: TotlRouteRole;
}

export function TotlAtmosphereShell({
  children,
  className,
  contentClassName,
  withGrid = true,
  withNoise = true,
  ambientTone = "default",
  routeRole,
  ...props
}: TotlAtmosphereShellProps) {
  return (
    <div
      className={cn(
        "totl-atmosphere-shell",
        ambientTone === "lifted" && "totl-atmosphere-shell--lifted",
        className
      )}
      data-role={routeRole}
      {...props}
    >
      <div className="totl-atmosphere-layer totl-atmosphere-base" aria-hidden />
      <div className="totl-atmosphere-layer totl-atmosphere-glow" aria-hidden />
      {withGrid ? <div className="totl-atmosphere-layer totl-atmosphere-grid" aria-hidden /> : null}
      {withNoise ? <div className="totl-atmosphere-layer totl-atmosphere-noise" aria-hidden /> : null}
      <div className={cn("relative z-[2] min-h-[100dvh]", contentClassName)}>{children}</div>
    </div>
  );
}
