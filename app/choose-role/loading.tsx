import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";

export default function ChooseRoleLoading() {
  return (
    <PageShell
      fullBleed
      className="grain-texture glow-backplate relative overflow-x-hidden text-white"
    >
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/3 via-white/8 to-white/3" />
      <div className="pointer-events-none absolute top-0 left-1/4 z-[1] h-72 w-72 rounded-full bg-white/3 blur-3xl animate-apple-float" />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 z-[1] h-96 w-96 rounded-full bg-white/3 blur-3xl animate-apple-float"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 container mx-auto flex min-h-[50vh] flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-white/10 sm:mb-8" />

        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-10 w-64 animate-pulse rounded bg-white/10" />
            <div className="mx-auto h-4 w-80 animate-pulse rounded bg-white/10" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
            <SectionCard paddingClassName="p-0">
              <div className="h-64 animate-pulse bg-white/10" />
              <div className="space-y-4 p-4 sm:p-8">
                <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              </div>
            </SectionCard>
            <SectionCard paddingClassName="p-0">
              <div className="h-64 animate-pulse bg-white/10" />
              <div className="space-y-4 p-4 sm:p-8">
                <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
