export default function ChooseRoleLoading() {
  return (
    <div className="min-h-screen bg-black page-ambient text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="h-10 w-64 mx-auto bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-80 mx-auto bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-32 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
          <div className="h-32 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
