import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <PageShell className="bg-black" containerClassName="max-w-3xl py-4 sm:py-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 bg-gray-800" />
          <Skeleton className="h-5 w-80 max-w-full bg-gray-800" />
        </div>
        <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <Skeleton className="h-8 w-40 bg-gray-800" />
          <Skeleton className="h-12 w-full bg-gray-800" />
          <Skeleton className="h-24 w-full bg-gray-800" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32 bg-gray-800" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
