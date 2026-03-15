import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function TalentDashboardLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-9 w-56 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-80 max-w-full bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
            <div className="h-4 w-28 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </AdminLoadingShell>
  );
}
