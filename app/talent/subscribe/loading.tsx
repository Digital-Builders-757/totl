import { Skeleton } from "@/components/ui/skeleton";

export default function SubscribeLoading() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] page-ambient pt-40">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 space-y-4 text-center sm:mb-12">
            <Skeleton className="mx-auto h-12 w-full max-w-md" />
            <Skeleton className="mx-auto h-6 w-full max-w-xl" />
            <Skeleton className="mx-auto h-5 w-full max-w-sm" />
          </div>

          {/* Plan cards skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="panel-frosted space-y-4 rounded-xl p-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Skeleton className="mx-auto h-4 w-64 max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
