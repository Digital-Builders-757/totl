import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerificationPendingLoading() {
  return (
    <PageShell fullBleed className="grain-texture glow-backplate relative overflow-x-hidden text-white">
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />

      <div className="relative z-10 container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 h-4 w-28 animate-pulse rounded bg-white/10" />

        <SectionCard className="mx-auto max-w-md" paddingClassName="p-0">
          <CardHeader className="p-6 sm:p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
            </div>
            <CardTitle className="text-center text-white">Loading...</CardTitle>
            <CardDescription className="text-center text-gray-400">Please wait</CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-8 sm:px-8">
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="mx-auto h-4 w-3/4 bg-white/10" />
            <div className="rounded-lg border border-border/40 bg-white/5 p-4">
              <Skeleton className="mb-4 h-4 w-full bg-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-white/10" />
                <Skeleton className="h-3 w-full bg-white/10" />
                <Skeleton className="h-3 w-full bg-white/10" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
