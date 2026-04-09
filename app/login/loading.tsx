export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="h-10 w-48 mx-auto bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-64 mx-auto bg-white/10 rounded animate-pulse" />
        </div>
        <div className="panel-frosted rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 mx-auto bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
