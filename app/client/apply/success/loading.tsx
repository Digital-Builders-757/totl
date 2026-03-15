export default function ApplySuccessLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-56 mx-auto bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-72 mx-auto bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 mx-auto bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
