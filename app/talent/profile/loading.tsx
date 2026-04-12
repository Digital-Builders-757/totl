import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentProfileLoading() {
  return (
    <PageShell className="bg-black" containerClassName="max-w-3xl py-4 sm:py-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 max-w-full bg-white/10" />
          <Skeleton className="h-5 w-80 max-w-full bg-white/10" />
        </div>
        <div className="panel-frosted space-y-6 rounded-2xl border border-white/10 bg-[var(--totl-surface-glass-strong)] p-4 sm:p-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
          </div>
          <Skeleton className="h-24 w-full bg-white/10" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24 bg-white/10" />
            <Skeleton className="h-10 w-32 bg-white/10" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
