export default function ClientApplicationsLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 h-8 w-36 animate-pulse rounded bg-gray-800" />
              <div className="h-4 w-64 max-w-[70vw] animate-pulse rounded bg-gray-900" />
            </div>
            <div className="hidden h-10 w-28 shrink-0 animate-pulse rounded-md bg-gray-800 md:block" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="mb-4 md:mb-8 md:hidden">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-800" />
        </div>

        <div className="mb-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-800" />
                  <div className="h-6 w-12 animate-pulse rounded bg-gray-800" />
                </div>
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-800" />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:gap-4">
          <div className="flex-1">
            <input
              disabled
              aria-label="Loading application search"
              placeholder="Search by talent name, gig title, or location..."
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400"
            />
          </div>
          <div className="hidden gap-2 md:flex">
            <div className="h-10 w-32 animate-pulse rounded-md border border-gray-700 bg-gray-800" />
            <div className="h-10 w-32 animate-pulse rounded-md border border-gray-700 bg-gray-800" />
          </div>
          <div className="md:hidden">
            <div className="h-10 w-28 animate-pulse rounded-md border border-gray-700 bg-gray-800" />
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex min-w-max gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
            {["All (0)", "New (0)", "Interviews (0)", "Hired (0)"].map((label) => (
              <div
                key={label}
                className="min-h-10 rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-400"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-800 bg-gray-900 p-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 animate-pulse rounded-full bg-gray-800" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="mb-2 h-6 w-32 animate-pulse rounded bg-gray-800" />
                      <div className="mb-2 h-4 w-48 animate-pulse rounded bg-gray-800" />
                      <div className="flex gap-4">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-800" />
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-800" />
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-800" />
                      </div>
                    </div>
                    <div className="h-6 w-24 animate-pulse rounded bg-gray-800" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 animate-pulse rounded bg-gray-800" />
                    <div className="h-8 w-20 animate-pulse rounded bg-gray-800" />
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
