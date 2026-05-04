import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { TotlBrandLoadingRibbon } from "@/components/ui/totl-brand-loading";

/** Matches talent dashboard Career Builder chrome; used by route loader + Suspense streaming. */
export function TalentDashboardSkeleton() {
  return (
    <PageShell ambientTone="lifted" topPadding={false} fullBleed routeRole="talent">
      <div className="px-4 py-8">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <TotlBrandLoadingRibbon
            compact
            eyebrow="Talent terminal"
            footline="Sharpening your dashboard…"
            className="max-w-xl"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full bg-muted/35" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-56 max-w-[min(14rem,100%)] rounded-lg bg-muted/40" />
                <Skeleton className="h-4 w-72 max-w-full rounded-lg bg-muted/35" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
              <Skeleton className="h-10 w-24 rounded-xl bg-muted/35" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="panel-frosted card-backlit rounded-2xl p-5"
              >
                <Skeleton className="mb-4 h-3 w-20 rounded-lg bg-muted/35" />
                <Skeleton className="h-9 w-14 rounded-lg bg-muted/45" />
                <Skeleton className="mt-4 h-2.5 w-28 rounded-lg bg-muted/25" />
              </div>
            ))}
          </div>

          <Skeleton className="h-12 w-full max-w-md rounded-xl bg-muted/35" />

          <div className="panel-frosted card-backlit overflow-hidden rounded-2xl border border-border/40">
            <div className="space-y-3 border-b border-border/35 px-5 py-4 sm:px-6">
              <Skeleton className="h-6 w-48 max-w-full rounded-lg bg-muted/40" />
              <Skeleton className="h-3.5 w-72 max-w-full rounded-lg bg-muted/28" />
            </div>
            <div className="p-4 sm:p-6">
              <Skeleton className="h-[min(420px,65vh)] w-full rounded-xl bg-muted/28" />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
