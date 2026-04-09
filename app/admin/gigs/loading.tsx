import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function AdminGigsLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-9 w-40 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-72 max-w-full bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-36 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-44 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="panel-frosted rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-16 w-24 rounded bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLoadingShell>
  );
}
