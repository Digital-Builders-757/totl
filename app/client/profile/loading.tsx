export default function ClientProfileLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient text-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-2 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse" />
        </div>
        <div className="panel-frosted rounded-lg p-6">
          <div className="space-y-6">
            <div className="h-4 bg-white/10 rounded w-1/4 animate-pulse" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
                  <div className="h-10 bg-white/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="h-10 bg-white/10 rounded flex-1 animate-pulse" />
              <div className="h-10 bg-white/10 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
