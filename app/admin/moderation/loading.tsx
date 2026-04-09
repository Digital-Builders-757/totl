import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function AdminModerationLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-3">
          <div className="h-9 w-52 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-96 max-w-full bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-36 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-[420px] w-full panel-frosted rounded-xl animate-pulse" />
      </div>
    </AdminLoadingShell>
  );
}
