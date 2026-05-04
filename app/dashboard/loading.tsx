import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TotlAtmosphereShell } from "@/components/ui/totl-atmosphere-shell";
import { TotlBrandLoadingRibbon } from "@/components/ui/totl-brand-loading";

export default function DashboardLoading() {
  return (
    <TotlAtmosphereShell className="grain-texture min-h-[100dvh] text-[var(--oklch-text-primary)]">
      <div className="container mx-auto px-4 py-10 pb-14 sm:px-6 lg:px-8">
        <TotlBrandLoadingRibbon
          compact
          eyebrow="TOTL Dashboard"
          footline="Selecting your lane…"
          className="mb-8 max-w-xl"
        />

        <Skeleton className="mb-8 h-10 w-48 rounded-xl bg-muted/40" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card className="border-border/45 bg-card/40">
              <CardHeader>
                <Skeleton className="mb-2 h-6 w-36 rounded-lg bg-muted/40" />
                <Skeleton className="h-4 w-48 rounded-lg bg-muted/35" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <Skeleton className="mb-2 h-4 w-24 rounded-lg bg-muted/35" />
                      <Skeleton className="h-6 w-full rounded-lg bg-muted/40" />
                    </div>
                  ))}
                  <div className="pt-4">
                    <Skeleton className="h-10 w-full rounded-lg bg-muted/40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="border-border/45 bg-card/40">
              <CardHeader>
                <Skeleton className="mb-2 h-6 w-48 rounded-lg bg-muted/40" />
                <Skeleton className="h-4 w-64 rounded-lg bg-muted/35" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Skeleton className="mb-4 h-5 w-36 rounded-lg bg-muted/40" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Skeleton className="h-10 w-full rounded-lg bg-muted/40" />
                    <Skeleton className="h-10 w-full rounded-lg bg-muted/35" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TotlAtmosphereShell>
  );
}
