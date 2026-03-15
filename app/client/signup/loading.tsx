export default function ClientSignupLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient text-white pt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
              </div>
            ))}
            <div className="h-10 w-full bg-white/10 rounded animate-pulse pt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
