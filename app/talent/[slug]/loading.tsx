import { Skeleton } from "@/components/ui/skeleton";

export default function TalentSlugLoading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] page-ambient pt-40">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Back link skeleton */}
          <Skeleton className="h-5 w-24" />

          {/* Profile header: avatar + name + meta */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Skeleton className="h-32 w-32 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-10 w-56 max-w-full" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-5 w-full max-w-md" />
            </div>
          </div>

          {/* Portfolio grid skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-7 w-32" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
