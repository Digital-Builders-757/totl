import { AdminHeader } from "@/components/admin/admin-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-[420px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}







