export default function ClientProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
