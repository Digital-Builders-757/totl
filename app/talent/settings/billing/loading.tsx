import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <PageShell containerClassName="max-w-3xl py-4 sm:py-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-lg border border-white/10 bg-white/5" />
          <Skeleton className="h-5 w-80 max-w-full rounded-lg border border-white/10 bg-white/5" />
        </div>
        <div className="panel-frosted space-y-4 rounded-2xl border border-white/10 bg-[var(--totl-surface-glass-strong)] p-6">
          <Skeleton className="h-8 w-40 rounded-lg border border-white/10 bg-white/5" />
          <Skeleton className="h-12 w-full rounded-lg border border-white/10 bg-white/5" />
          <Skeleton className="h-24 w-full rounded-lg border border-white/10 bg-white/5" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32 rounded-lg border border-white/10 bg-white/5" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
