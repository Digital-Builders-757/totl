import { AdminHeader } from "@/components/admin/admin-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGigsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-72 max-w-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="p-4 border-b border-gray-200 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-24 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
