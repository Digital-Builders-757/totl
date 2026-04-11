import { PageShell } from "@/components/layout/page-shell";

export default function SettingsLoading() {
  return (
    <PageShell className="grain-texture" containerClassName="py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-muted/35" />
        </div>

        <div className="space-y-6">
          <div className="panel-frosted rounded-2xl p-6">
            <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-muted/40" />
            <div className="mb-6 h-4 w-64 max-w-full animate-pulse rounded-lg bg-muted/35" />
            <div className="space-y-4">
              <div>
                <div className="mb-2 h-4 w-16 animate-pulse rounded bg-muted/35" />
                <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
              </div>
              <div>
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted/35" />
                <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
              </div>
            </div>
          </div>

          <div className="panel-frosted rounded-2xl p-6">
            <div className="mb-4 h-6 w-32 animate-pulse rounded-lg bg-muted/40" />
            <div className="mb-6 h-4 w-80 max-w-full animate-pulse rounded-lg bg-muted/35" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="mb-2 h-4 w-20 animate-pulse rounded bg-muted/35" />
                  <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-muted/35" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
