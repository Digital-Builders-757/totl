import { AdminLoadingShell } from "@/components/admin/admin-loading-shell";

export default function GigSuccessLoading() {
  return (
    <AdminLoadingShell>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-8">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse mb-4" />
            <div className="h-8 w-64 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-80 bg-white/10 rounded animate-pulse mb-1" />
            <div className="h-4 w-72 bg-white/10 rounded animate-pulse" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800/50 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-6 w-28 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="h-48 w-full md:w-1/3 rounded-lg bg-white/10 animate-pulse" />
              <div className="md:w-2/3 space-y-4">
                <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
        </div>

        <div className="h-64 w-full rounded-xl border border-gray-700 bg-gray-800/50 animate-pulse" />
      </div>
    </AdminLoadingShell>
  );
}
