import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { TotlBrandLoadingRibbon } from "@/components/ui/totl-brand-loading";

export function ClientDashboardSkeleton() {
  return (
    <PageShell ambientTone="lifted" topPadding={false} fullBleed routeRole="client">
      <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <TotlBrandLoadingRibbon
            compact
            eyebrow="Career Builder"
            footline="Composing your pipeline…"
            className="max-w-xl pb-2"
          />

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-lg bg-muted/40" />
              <Skeleton className="h-4 w-80 max-w-full rounded-lg bg-muted/35" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-28 rounded-xl bg-muted/35" />
              <Skeleton className="h-10 w-36 rounded-xl bg-muted/35" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="panel-frosted card-backlit rounded-2xl p-4"
              >
                <Skeleton className="h-4 w-24 rounded-lg bg-muted/35" />
                <div className="mt-3 flex items-end justify-between">
                  <Skeleton className="h-8 w-16 rounded-lg bg-muted/40" />
                  <Skeleton className="h-6 w-10 rounded-lg bg-muted/35" />
                </div>
                <Skeleton className="mt-4 h-3 w-28 rounded-lg bg-muted/30" />
              </div>
            ))}
          </div>

          {/* Main panels */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="panel-frosted card-backlit rounded-2xl"
              >
                <div className="space-y-3 p-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40 rounded-lg bg-muted/40" />
                    <Skeleton className="h-6 w-16 rounded-full bg-muted/35" />
                  </div>
                  <Skeleton className="h-4 w-64 max-w-full rounded-lg bg-muted/35" />
                </div>
                <div className="space-y-4 px-6 pb-6">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div
                      // eslint-disable-next-line react/no-array-index-key
                      key={j}
                      className="flex items-center gap-4 rounded-xl border border-border/35 bg-card/35 p-4"
                    >
                      <Skeleton className="h-12 w-12 rounded-lg bg-muted/35" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48 max-w-full rounded-lg bg-muted/40" />
                        <Skeleton className="h-3 w-64 max-w-full rounded-lg bg-muted/30" />
                      </div>
                      <Skeleton className="h-4 w-16 rounded-lg bg-muted/35" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs placeholder */}
          <div className="panel-frosted card-backlit space-y-4 rounded-2xl p-6">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={i} className="h-9 w-28 rounded-full bg-muted/35" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-40 w-full rounded-xl bg-muted/30" />
              <Skeleton className="h-40 w-full rounded-xl bg-muted/30" />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
