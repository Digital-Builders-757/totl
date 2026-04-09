export default function ApplyLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-5 w-28 bg-white/10 rounded animate-pulse" />
          <div className="panel-frosted rounded-xl p-4">
            <div className="h-6 w-48 bg-white/10 rounded mb-2 animate-pulse" />
            <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="panel-frosted rounded-xl p-6 space-y-4">
            <div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-24 w-full bg-white/10 rounded animate-pulse" />
            <div className="h-24 w-full bg-white/10 rounded animate-pulse" />
            <div className="flex justify-end gap-2 pt-4">
              <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
