import { Skeleton } from "@/components/ui/skeleton";

export function ClientDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-4 w-80 bg-white/10" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-full bg-white/10" />
            <Skeleton className="h-10 w-36 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm"
            >
              <Skeleton className="h-4 w-24 bg-white/10" />
              <div className="mt-3 flex items-end justify-between">
                <Skeleton className="h-8 w-16 bg-white/10" />
                <Skeleton className="h-6 w-10 bg-white/10" />
              </div>
              <Skeleton className="mt-4 h-3 w-28 bg-white/10" />
            </div>
          ))}
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 shadow-sm"
            >
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40 bg-white/10" />
                  <Skeleton className="h-6 w-16 rounded-full bg-white/10" />
                </div>
                <Skeleton className="h-4 w-64 bg-white/10" />
              </div>
              <div className="px-6 pb-6 space-y-4">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={j}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <Skeleton className="h-12 w-12 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48 bg-white/10" />
                      <Skeleton className="h-3 w-64 bg-white/10" />
                    </div>
                    <Skeleton className="h-4 w-16 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs placeholder */}
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <Skeleton key={i} className="h-9 w-28 rounded-full bg-white/10" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-40 w-full rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
