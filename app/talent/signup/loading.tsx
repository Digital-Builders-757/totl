import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentSignupLoading() {
  return (
    <PageShell fullBleed className="grain-texture glow-backplate relative overflow-x-hidden text-white">
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />

      <div className="relative z-10 container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 h-5 w-24 animate-pulse rounded bg-white/10" />

        <SectionCard className="mx-auto max-w-4xl overflow-hidden" paddingClassName="p-0">
          <div className="grid md:grid-cols-5">
            <div className="relative hidden md:col-span-2 md:block">
              <div className="aspect-[3/4] bg-white/10" />
            </div>

            <div className="space-y-6 p-6 sm:p-8 md:col-span-3">
              <div className="mb-8 space-y-2">
                <Skeleton className="mb-2 h-8 w-48 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
              </div>

              <Skeleton className="mb-6 h-4 w-full bg-white/10" />

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="mb-2 h-4 w-24 bg-white/10" />
                    <Skeleton className="h-10 w-full bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="mb-2 h-4 w-24 bg-white/10" />
                    <Skeleton className="h-10 w-full bg-white/10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="mb-2 h-4 w-24 bg-white/10" />
                  <Skeleton className="h-10 w-full bg-white/10" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="mb-2 h-4 w-24 bg-white/10" />
                  <Skeleton className="h-10 w-full bg-white/10" />
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="mb-2 h-4 w-24 bg-white/10" />
                  <Skeleton className="h-10 w-full bg-white/10" />
                </div>

                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 bg-white/10" />
                  <Skeleton className="h-4 w-64 bg-white/10" />
                </div>

                <Skeleton className="h-12 w-full bg-white/10" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
