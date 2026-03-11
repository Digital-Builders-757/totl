import { Skeleton } from "@/components/ui/skeleton";

export default function SubscribeLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <Skeleton className="h-12 w-96 mx-auto bg-zinc-800/50" />
          <Skeleton className="h-6 w-[28rem] mx-auto bg-zinc-800/50" />
          <Skeleton className="h-5 w-80 mx-auto bg-zinc-800/50" />
        </div>

        {/* Plan cards skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 space-y-4"
            >
              <Skeleton className="h-8 w-32 bg-zinc-800/50" />
              <Skeleton className="h-10 w-24 bg-zinc-800/50" />
              <Skeleton className="h-5 w-full bg-zinc-800/50" />
              <Skeleton className="h-5 w-4/5 bg-zinc-800/50" />
              <Skeleton className="h-12 w-full bg-zinc-800/50" />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Skeleton className="h-4 w-64 mx-auto bg-zinc-800/50" />
        </div>
      </div>
    </div>
  );
}
