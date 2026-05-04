import { AuthLoadingShell } from "@/components/layout/auth-loading-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientSignupLoading() {
  return (
    <AuthLoadingShell ribbonFootline="Loading application…">
      <div className="container mx-auto px-4 pb-12 pt-1 sm:px-6 lg:px-8">
        <div className="mb-8 h-4 w-16 animate-pulse rounded bg-white/10" />

        <SectionCard className="mx-auto max-w-md overflow-hidden" paddingClassName="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/10" />
              <div className="mx-auto h-6 max-w-[90%] animate-pulse rounded bg-white/10" />
              <div className="mx-auto h-4 w-full animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-20 animate-pulse rounded-lg bg-white/10" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-[83%] bg-white/10" />
            </div>
            <Skeleton className="h-10 w-full bg-white/10" />
            <Skeleton className="h-10 w-full bg-white/10" />
          </div>
        </SectionCard>
      </div>
    </AuthLoadingShell>
  );
}
