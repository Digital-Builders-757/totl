import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function CreateUserLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-60 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse pt-4" />
        </div>
      </div>
    </AdminLoadingShell>
  );
}
