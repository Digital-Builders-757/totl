import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentDashboardLoading() {
  return (
    <PageShell ambientTone="lifted" topPadding={false} fullBleed>
      <div className="px-4 py-8">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-muted/40" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-56 rounded-lg bg-muted/40" />
                <Skeleton className="h-4 w-72 max-w-full rounded-lg bg-muted/35" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
              <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full rounded-2xl bg-muted/35" />
            <Skeleton className="h-28 w-full rounded-2xl bg-muted/35" />
            <Skeleton className="h-28 w-full rounded-2xl bg-muted/35" />
          </div>
          <Skeleton className="h-12 w-full max-w-md rounded-xl bg-muted/35" />
          <Skeleton className="h-[420px] w-full rounded-2xl bg-muted/30" />
        </div>
      </div>
    </PageShell>
  );
}
