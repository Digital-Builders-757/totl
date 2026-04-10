import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FloatingPathsBackground } from "@/components/ui/floating-paths-background";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthCallbackLoading() {
  return (
    <PageShell fullBleed className="grain-texture glow-backplate relative overflow-x-hidden text-white">
      <FloatingPathsBackground opacity={0.08} color="white" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-40" />

      <div className="relative z-10 flex min-h-[60vh] items-center justify-center p-4">
        <SectionCard className="w-full max-w-md" paddingClassName="p-6 sm:p-8">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-center text-white">Email Verification</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Verifying your email address...
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Skeleton className="mb-6 h-12 w-12 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-64 max-w-full bg-white/10" />
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
