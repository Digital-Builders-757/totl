import type { ComponentType } from "react";

import { Skeleton } from "./skeleton";

const shellSurface =
  "overflow-hidden rounded-xl border border-[var(--oklch-border-alpha)] bg-[var(--oklch-panel-alpha)]";

/**
 * Portfolio Item Skeleton
 * Used for loading states in portfolio gallery and preview
 */
export function PortfolioItemSkeleton() {
  return (
    <div className={`relative ${shellSurface}`}>
      {/* Image skeleton */}
      <Skeleton className="h-64 w-full rounded-none" />

      {/* Content skeleton */}
      <div className="space-y-3 p-4">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Caption */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

/**
 * Portfolio Preview Skeleton
 * Used for smaller portfolio preview tiles on dashboard
 */
export function PortfolioPreviewSkeleton() {
  return (
    <div className={shellSurface}>
      <Skeleton className="aspect-square w-full rounded-none" />
    </div>
  );
}

/**
 * Gig Card Skeleton
 * Used for gig listings on browse page
 */
export function GigCardSkeleton() {
  return (
    <div className={shellSurface}>
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      {/* Content skeleton */}
      <div className="space-y-4 p-6">
        {/* Title */}
        <Skeleton className="h-6 w-5/6" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * Avatar Skeleton
 * Used for profile images and user avatars
 */
export function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

/**
 * Card Skeleton
 * Generic card skeleton for various content types
 */
export function CardSkeleton() {
  return (
    <div className={`space-y-4 rounded-xl border border-[var(--oklch-border-alpha)] bg-[var(--oklch-panel-alpha)] p-6`}>
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 * Used for loading states in tables and lists
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  const widths = ["72%", "88%", "64%", "92%", "70%", "85%"];
  return (
    <div className="flex items-center gap-4 border-b border-[var(--oklch-border-alpha)] p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: widths[i % widths.length] }} />
      ))}
    </div>
  );
}

/**
 * Grid Skeleton
 * Used for loading grid layouts (portfolio, gigs, etc.)
 */
export function GridSkeleton({
  count = 6,
  component: Component = PortfolioPreviewSkeleton,
}: {
  count?: number;
  component?: ComponentType;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
