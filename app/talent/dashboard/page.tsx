import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardClient } from "./client";
import { getBootState } from "@/lib/actions/boot-actions";
import { getTalentDashboardData } from "@/lib/actions/dashboard-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";

export const dynamic = "force-dynamic";

async function DashboardDataLoader({ userId }: { userId: string }) {
  const dashboardData = await getTalentDashboardData(userId);
  return <DashboardClient initialData={dashboardData} />;
}

export default async function DashboardPage() {
  try {
    const boot = await getBootState();
    if (!boot) redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.TALENT_DASHBOARD)}`);

    if (boot.needsOnboarding) redirect(ONBOARDING_PATH);
    if (boot.nextPath !== PATHS.TALENT_DASHBOARD) redirect(boot.nextPath);

    // Stream dashboard data with Suspense for progressive rendering
    return (
      <Suspense fallback={<DashboardClient initialData={null} />}>
        <DashboardDataLoader userId={boot.userId} />
      </Suspense>
    );
  } catch (error) {
    // CRITICAL: Next.js redirect() throws a special error to interrupt execution
    // We must re-throw redirect errors so they work correctly
    if (isRedirectError(error)) {
      throw error;
    }

    // Log error for debugging but don't expose sensitive details
    console.error("[talent/dashboard] Error in server component:", error);
    // Redirect to login on error to prevent render failures
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.TALENT_DASHBOARD)}`);
  }
}
