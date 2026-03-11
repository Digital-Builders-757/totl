import { Skeleton } from "@/components/ui/skeleton";

export default function GigDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] pt-40">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back link skeleton */}
          <Skeleton className="h-5 w-24 bg-zinc-800/50" />

          {/* Hero image skeleton */}
          <Skeleton className="aspect-video w-full rounded-xl bg-zinc-800/50" />

          {/* Title and meta skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-3/4 bg-zinc-800/50" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-5 w-32 bg-zinc-800/50" />
              <Skeleton className="h-5 w-28 bg-zinc-800/50" />
              <Skeleton className="h-5 w-24 bg-zinc-800/50" />
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-full bg-zinc-800/50" />
            <Skeleton className="h-5 w-full bg-zinc-800/50" />
            <Skeleton className="h-5 w-4/5 bg-zinc-800/50" />
          </div>

          {/* Apply card skeleton */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6">
            <Skeleton className="h-8 w-40 mb-4 bg-zinc-800/50" />
            <Skeleton className="h-12 w-full bg-zinc-800/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
