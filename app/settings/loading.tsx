export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          <div className="space-y-6">
            {/* Account Information Card */}
            <div className="bg-white rounded-lg border p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>
              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Role-Specific Card */}
            <div className="bg-white rounded-lg border p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-80 mb-6 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
