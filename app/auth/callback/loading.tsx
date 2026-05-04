import { AuthLoadingShell } from "@/components/layout/auth-loading-shell";
import { SectionCard } from "@/components/layout/section-card";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthCallbackLoading() {
  return (
    <AuthLoadingShell ribbonFootline="Verifying credentials…">
      <div className="flex min-h-[52vh] items-center justify-center p-4 pt-2">
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
    </AuthLoadingShell>
  );
}
