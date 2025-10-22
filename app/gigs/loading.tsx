import { GigCardSkeleton } from "@/components/ui/image-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] pt-40">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb skeleton */}
          <div className="mb-6 sm:mb-8 flex items-center gap-3 px-2 sm:px-0">
            <Skeleton className="h-4 w-16 bg-zinc-800/50" />
            <span className="text-[var(--oklch-text-muted)]">/</span>
            <Skeleton className="h-4 w-24 bg-zinc-800/50" />
          </div>

          {/* Hero section skeleton */}
          <div className="mb-16 text-center animate-pulse">
            <Skeleton className="h-16 w-64 mx-auto mb-8 bg-zinc-800/50" />
            <Skeleton className="h-6 w-96 mx-auto mb-4 bg-zinc-800/50" />
            <Skeleton className="h-6 w-80 mx-auto bg-zinc-800/50" />
          </div>

          {/* Filter form skeleton */}
          <div className="glass-card p-6 sm:p-8 mb-10 sm:mb-12 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-12 bg-zinc-800/50" />
              <Skeleton className="h-12 bg-zinc-800/50" />
              <Skeleton className="h-12 bg-zinc-800/50" />
              <Skeleton className="h-12 bg-zinc-800/50" />
            </div>
          </div>

          {/* Gig cards skeleton grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <GigCardSkeleton key={i} />
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="max-w-4xl mx-auto mt-8 sm:mt-10 px-4 sm:px-0 animate-pulse">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48 bg-zinc-800/50" />
              <div className="flex gap-3">
                <Skeleton className="h-12 w-32 bg-zinc-800/50" />
                <Skeleton className="h-12 w-32 bg-zinc-800/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
