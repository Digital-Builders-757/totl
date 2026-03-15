import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function CreateGigLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-3">
          <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-72 max-w-full bg-white/10 rounded animate-pulse" />
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-24 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </AdminLoadingShell>
  );
}
