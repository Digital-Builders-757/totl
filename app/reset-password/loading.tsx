import { AuthLoadingShell } from "@/components/layout/auth-loading-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TotlBrandLoadingRail } from "@/components/ui/totl-brand-loading";

export default function ResetPasswordLoading() {
  return (
    <AuthLoadingShell ribbonFootline="Preparing recovery…">
      <div className="flex min-h-[52vh] items-center justify-center px-4 pb-16 pt-2">
        <SectionCard className="w-full max-w-md overflow-hidden" paddingClassName="p-6 sm:p-8">
          <div className="space-y-5">
            <div className="space-y-1 text-center">
              <Skeleton className="mx-auto h-7 w-48 rounded-lg bg-white/10" />
              <Skeleton className="mx-auto h-4 w-64 max-w-full rounded-lg bg-white/10" />
            </div>
            <TotlBrandLoadingRail className="opacity-95" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
              <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
              <Skeleton className="mx-auto h-4 w-40 rounded-lg bg-white/10" />
            </div>
          </div>
        </SectionCard>
      </div>
    </AuthLoadingShell>
  );
}
