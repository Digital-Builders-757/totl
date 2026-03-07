import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56 bg-zinc-800/70" />
          <Skeleton className="h-4 w-72 max-w-full bg-zinc-800/60" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-xl bg-zinc-800/60" />
          <Skeleton className="h-24 w-full rounded-xl bg-zinc-800/60" />
          <Skeleton className="h-24 w-full rounded-xl bg-zinc-800/60" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl bg-zinc-800/60" />
      </div>
    </div>
  );
}

