import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function TalentProfileLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
        <div className="panel-frosted rounded-xl p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-full max-w-md bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full bg-white/10 rounded animate-pulse" />
            ))}
            <div className="flex justify-end">
              <div className="h-10 w-40 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </AdminLoadingShell>
  );
}
