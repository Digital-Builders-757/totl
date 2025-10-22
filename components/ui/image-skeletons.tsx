import { Skeleton } from "./skeleton";

/**
 * Portfolio Item Skeleton
 * Used for loading states in portfolio gallery and preview
 */
export function PortfolioItemSkeleton() {
  return (
    <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-lg">
      {/* Image skeleton */}
      <Skeleton className="w-full h-64 rounded-none bg-zinc-800/50" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 bg-zinc-800/50" />
        
        {/* Caption */}
        <Skeleton className="h-4 w-full bg-zinc-800/50" />
        <Skeleton className="h-4 w-2/3 bg-zinc-800/50" />
        
        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 bg-zinc-800/50" />
          <Skeleton className="h-9 w-9 bg-zinc-800/50" />
          <Skeleton className="h-9 w-9 bg-zinc-800/50" />
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
    <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-lg">
      <Skeleton className="w-full aspect-square rounded-none bg-zinc-800/50" />
    </div>
  );
}

/**
 * Gig Card Skeleton
 * Used for gig listings on browse page
 */
export function GigCardSkeleton() {
  return (
    <div className="overflow-hidden bg-zinc-900 border border-zinc-800 rounded-lg">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-[4/3] rounded-none bg-zinc-800/50" />
      
      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <Skeleton className="h-6 w-5/6 bg-zinc-800/50" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-zinc-800/50" />
          <Skeleton className="h-4 w-4/5 bg-zinc-800/50" />
        </div>
        
        {/* Metadata */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3 bg-zinc-800/50" />
          <Skeleton className="h-4 w-1/2 bg-zinc-800/50" />
          <Skeleton className="h-4 w-3/5 bg-zinc-800/50" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-12 w-full bg-zinc-800/50" />
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
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <Skeleton className={`${sizeClasses[size]} rounded-full bg-zinc-800/50`} />
  );
}

/**
 * Card Skeleton
 * Generic card skeleton for various content types
 */
export function CardSkeleton() {
  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-4">
      <Skeleton className="h-6 w-3/4 bg-zinc-800/50" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-zinc-800/50" />
        <Skeleton className="h-4 w-5/6 bg-zinc-800/50" />
        <Skeleton className="h-4 w-4/6 bg-zinc-800/50" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 * Used for loading states in tables and lists
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-zinc-800">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4 flex-1 bg-zinc-800/50" 
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
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
  component: Component = PortfolioPreviewSkeleton 
}: { 
  count?: number;
  component?: React.ComponentType;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

