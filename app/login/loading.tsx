import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";

export default function LoginLoading() {
  return (
    <PageShell fullBleed className="grain-texture glow-backplate relative overflow-x-hidden text-white">
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />

      <div className="relative z-10 container mx-auto px-4 py-4 sm:px-6 sm:py-6 md:py-8 lg:px-8">
        <div className="mb-4 h-4 w-28 animate-pulse rounded bg-white/10 sm:mb-6 md:mb-6" />

        <SectionCard className="mx-auto max-w-md overflow-hidden" paddingClassName="p-4 sm:p-6 md:p-8">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-8 w-44 animate-pulse rounded bg-white/10 sm:h-10 sm:w-48" />
              <div className="mx-auto h-4 w-60 animate-pulse rounded bg-white/10 sm:w-64" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              </div>
              <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              <div className="mx-auto h-4 w-48 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
