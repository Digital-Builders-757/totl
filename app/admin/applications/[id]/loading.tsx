import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function AdminApplicationDetailLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6 space-y-4">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-4/5 bg-white/10 rounded animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2 pt-4">
            <div className="h-10 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </AdminLoadingShell>
  );
}
