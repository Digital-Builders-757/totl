import { Skeleton } from "@/components/ui/skeleton";

export default function GigDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] page-ambient pt-40">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Back link skeleton */}
          <Skeleton className="h-5 w-24" />

          {/* Hero image skeleton */}
          <Skeleton className="aspect-video w-full rounded-xl" />

          {/* Title and meta skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-3/4 max-w-full" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>

          {/* Apply card skeleton */}
          <div className="panel-frosted rounded-xl p-6">
            <Skeleton className="mb-4 h-8 w-40" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
