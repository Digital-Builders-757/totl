export default function ClientGigsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-48 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="space-y-2 mb-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
