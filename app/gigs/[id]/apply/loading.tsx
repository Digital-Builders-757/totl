import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplyToGigLoading() {
  return (
    <PageShell ambientTone="lifted" routeRole="talent" containerClassName="py-8 sm:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-56 rounded-lg bg-muted/40" />

        <div className="panel-frosted card-backlit rounded-[1.5rem] p-6 space-y-4">
          <Skeleton className="h-8 w-3/4 max-w-md rounded-lg bg-muted/40" />
          <Skeleton className="h-4 w-full rounded-lg bg-muted/30" />
          <Skeleton className="h-4 w-full rounded-lg bg-muted/30" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Skeleton className="h-14 rounded-xl bg-muted/35" />
            <Skeleton className="h-14 rounded-xl bg-muted/35" />
          </div>
        </div>

        <div className="panel-frosted card-backlit rounded-[1.5rem] p-6 space-y-4">
          <Skeleton className="h-7 w-48 rounded-lg bg-muted/40" />
          <Skeleton className="h-28 w-full rounded-xl bg-muted/35" />
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Skeleton className="h-11 flex-1 rounded-xl bg-muted/35 sm:max-w-[140px]" />
            <Skeleton className="h-11 flex-1 rounded-xl bg-muted/35" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
