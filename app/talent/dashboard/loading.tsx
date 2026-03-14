export default function TalentDashboardLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient">
      {/* Header skeleton */}
      <div className="border-b border-white/10 sticky top-0 z-40 bg-black/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-9 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-9 w-24 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="h-4 w-20 bg-white/10 rounded mb-2 animate-pulse" />
              <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="h-6 w-32 bg-white/10 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
