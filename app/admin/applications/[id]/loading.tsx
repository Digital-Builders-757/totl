import { AdminHeader } from "@/components/admin/admin-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminApplicationDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <Skeleton className="h-5 w-24" />
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
