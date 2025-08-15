export default function ClientApplicationsLoading() {
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
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
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
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                      <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
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
