import { GigCardSkeleton } from "@/components/ui/image-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { TotlBrandLoadingRibbon } from "@/components/ui/totl-brand-loading";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] page-ambient pt-40">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 px-2 sm:px-0">
            <TotlBrandLoadingRibbon
              compact
              eyebrow="Opportunities"
              footline="Indexing opportunities…"
              className="max-w-xl"
            />
          </div>

          {/* Breadcrumb skeleton */}
          <div className="mb-6 flex items-center gap-3 px-2 sm:mb-8 sm:px-0">
            <Skeleton className="h-4 w-16" />
            <span className="text-[var(--oklch-text-muted)]">/</span>
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Hero section skeleton */}
          <div className="mb-10 text-center sm:mb-12">
            <Skeleton className="mx-auto mb-5 h-14 max-w-[16rem] sm:mb-6 sm:h-16 sm:max-w-md" />
            <Skeleton className="mx-auto mb-3 h-6 max-w-xl" />
            <Skeleton className="mx-auto h-6 max-w-lg" />
          </div>

          {/* Filter form skeleton — matches gigs list filter shell */}
          <div className="panel-frosted grain-texture relative mb-10 p-4 shadow-lg sm:mb-12 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </div>

          {/* Gig cards skeleton grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <GigCardSkeleton key={i} />
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="mx-auto mt-8 max-w-4xl px-4 sm:mt-10 sm:px-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-4 w-48 max-w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
