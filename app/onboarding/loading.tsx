import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <PageShell
      className="grain-texture glow-backplate overflow-x-hidden"
      containerClassName="mx-auto max-w-3xl px-4 py-10 sm:px-6"
    >
      <SectionCard paddingClassName="p-6 sm:p-8">
        <div className="mb-6 space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-64 rounded bg-white/10" />
          <Skeleton className="mx-auto h-4 w-full max-w-md rounded bg-white/10" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded bg-white/10" />
          <Skeleton className="h-10 w-full rounded bg-white/10" />
          <Skeleton className="h-32 w-full rounded bg-white/10" />
        </div>
      </SectionCard>
    </PageShell>
  );
}
