"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthEntryShell } from "@/components/layout/auth-entry-shell";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PATHS } from "@/lib/constants/routes";

export default function TalentSignupClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnUrl = searchParams?.get("returnUrl") ?? null;

  useEffect(() => {
    const redirectUrl =
      returnUrl != null && returnUrl !== ""
        ? `${PATHS.CHOOSE_ROLE}?returnUrl=${encodeURIComponent(returnUrl)}`
        : PATHS.CHOOSE_ROLE;
    router.replace(redirectUrl);
  }, [returnUrl, router]);

  const backHref =
    returnUrl != null && returnUrl !== ""
      ? `${PATHS.CHOOSE_ROLE}?returnUrl=${encodeURIComponent(returnUrl)}`
      : PATHS.HOME;

  return (
    <AuthEntryShell backHref={backHref} backLabel="Back">
      <div className="flex flex-col items-center gap-6 text-center">
        <LoadingSpinner size="lg" className="text-white" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-white">Taking you to sign up</p>
          <p className="text-sm text-gray-400">One moment while we open the talent signup flow.</p>
        </div>
      </div>
    </AuthEntryShell>
  );
}
