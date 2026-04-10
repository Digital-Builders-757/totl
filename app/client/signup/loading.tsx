import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";

export default function ClientSignupLoading() {
  return (
    <PageShell fullBleed className="grain-texture glow-backplate relative overflow-x-hidden text-white">
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 lg:px-8">
        <div className="mb-8 h-4 w-16 animate-pulse rounded bg-white/10" />

        <SectionCard className="mx-auto max-w-md overflow-hidden" paddingClassName="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/10" />
              <div className="mx-auto h-6 w-4/5 animate-pulse rounded bg-white/10" />
              <div className="mx-auto h-4 w-full animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-20 animate-pulse rounded-lg bg-white/10" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
