import { cn } from "@/lib/utils/utils";

const densityHeight = {
  sm: "h-16 sm:h-20",
  md: "h-20 sm:h-24",
  lg: "h-24 sm:h-32",
} as const;

type TotlSectionDividerVariant = "default" | "hero" | "soft";
type TotlSectionDividerDensity = keyof typeof densityHeight;

interface TotlSectionDividerProps {
  className?: string;
  variant?: TotlSectionDividerVariant;
  density?: TotlSectionDividerDensity;
}

export function TotlSectionDivider({
  className,
  variant = "default",
  density = "md",
}: TotlSectionDividerProps) {
  return (
    <div
      aria-hidden
      data-totl-divider={variant}
      className={cn("totl-section-divider relative w-full overflow-hidden", densityHeight[density], className)}
    >
      <div className="totl-section-divider__band absolute inset-0" />
      <div className="totl-section-divider__line absolute left-0 right-0 top-1/2 -translate-y-1/2" />
    </div>
  );
}
