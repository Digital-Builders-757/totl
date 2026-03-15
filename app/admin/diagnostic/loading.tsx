import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function AdminDiagnosticLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-9 w-72 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-96 max-w-full bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 w-full rounded-xl border border-gray-700 bg-gray-800/50 animate-pulse" />
          <div className="h-24 w-full rounded-xl border border-gray-700 bg-gray-800/50 animate-pulse" />
          <div className="h-24 w-full rounded-xl border border-gray-700 bg-gray-800/50 animate-pulse" />
        </div>
        <div className="h-[420px] w-full rounded-xl border border-gray-700 bg-gray-800/50 animate-pulse" />
      </div>
    </AdminLoadingShell>
  );
}
