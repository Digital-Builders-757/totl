import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function AdminDashboardLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-9 w-44 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-80 max-w-full bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel-frosted rounded-xl p-4">
              <div className="h-4 w-20 bg-white/10 rounded mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="panel-frosted rounded-xl p-6">
            <div className="h-6 w-32 bg-white/10 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="panel-frosted rounded-xl p-6">
            <div className="h-6 w-40 bg-white/10 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLoadingShell>
  );
}
