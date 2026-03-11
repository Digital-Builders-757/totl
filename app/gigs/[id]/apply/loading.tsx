import { Skeleton } from "@/components/ui/skeleton";

export default function ApplyToGigLoading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] pt-40">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back link skeleton */}
          <Skeleton className="h-5 w-28 bg-zinc-800/50" />

          {/* Gig summary skeleton */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
            <Skeleton className="h-6 w-48 mb-2 bg-zinc-800/50" />
            <Skeleton className="h-4 w-full bg-zinc-800/50" />
          </div>

          {/* Form skeleton */}
          <div className="space-y-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6">
            <Skeleton className="h-8 w-40 bg-zinc-800/50" />
            <Skeleton className="h-24 w-full bg-zinc-800/50" />
            <Skeleton className="h-24 w-full bg-zinc-800/50" />
            <div className="flex justify-end gap-2 pt-4">
              <Skeleton className="h-10 w-24 bg-zinc-800/50" />
              <Skeleton className="h-10 w-32 bg-zinc-800/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
