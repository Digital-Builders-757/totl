import { AuthLoadingShell } from "@/components/layout/auth-loading-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentSignupLoading() {
  return (
    <AuthLoadingShell ribbonFootline="Building your onboarding…">
      <div className="container mx-auto px-4 pb-12 pt-1 sm:px-6 lg:px-8">
        <div className="mb-8 h-5 w-24 animate-pulse rounded bg-white/10" />

        <SectionCard className="mx-auto max-w-4xl overflow-hidden" paddingClassName="p-0">
          <div className="grid md:grid-cols-5">
            <div className="relative hidden md:col-span-2 md:block">
              <div className="aspect-[3/4] bg-white/[0.06]" />
            </div>

            <div className="space-y-6 p-6 sm:p-8 md:col-span-3">
              <div className="mb-8 space-y-2">
                <Skeleton className="mb-2 h-8 w-48 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-[75%] bg-white/10" />
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
                  <Skeleton className="h-4 w-[75%] bg-white/10" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="mb-2 h-4 w-24 bg-white/10" />
                  <Skeleton className="h-10 w-full bg-white/10" />
                </div>

                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 bg-white/10" />
                  <Skeleton className="h-4 w-64 max-w-full bg-white/10" />
                </div>

                <Skeleton className="h-12 w-full bg-white/10" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </AuthLoadingShell>
  );
}
