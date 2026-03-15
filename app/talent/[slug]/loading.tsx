import { Skeleton } from "@/components/ui/skeleton";

export default function TalentSlugLoading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] page-ambient pt-40">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back link skeleton */}
          <Skeleton className="h-5 w-24 bg-zinc-800/50" />

          {/* Profile header: avatar + name + meta */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Skeleton className="h-32 w-32 shrink-0 rounded-full bg-zinc-800/50" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-56 bg-zinc-800/50" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-5 w-24 bg-zinc-800/50" />
                <Skeleton className="h-5 w-32 bg-zinc-800/50" />
                <Skeleton className="h-5 w-28 bg-zinc-800/50" />
              </div>
              <Skeleton className="h-5 w-full max-w-md bg-zinc-800/50" />
            </div>
          </div>

          {/* Portfolio grid skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-7 w-32 bg-zinc-800/50" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg bg-zinc-800/50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
