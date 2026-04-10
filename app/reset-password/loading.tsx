import { PageShell } from "@/components/layout/page-shell";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ResetPasswordLoading() {
  return (
    <PageShell
      fullBleed
      className="grain-texture glow-backplate relative overflow-x-hidden text-white"
    >
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />
      <div className="relative z-10 flex min-h-[60vh] items-center justify-center px-4">
        <LoadingSpinner size="lg" className="text-white" />
      </div>
    </PageShell>
  );
}
