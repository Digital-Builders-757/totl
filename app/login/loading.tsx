import { AuthLoadingShell } from "@/components/layout/auth-loading-shell";
import { SectionCard } from "@/components/layout/section-card";

export default function LoginLoading() {
  return (
    <AuthLoadingShell ribbonFootline="Opening sign in…">
      <div className="container mx-auto px-4 pb-10 pt-1 sm:px-6 md:pb-12 lg:px-8">
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
    </AuthLoadingShell>
  );
}
