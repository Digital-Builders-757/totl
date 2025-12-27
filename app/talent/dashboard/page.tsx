import { redirect } from "next/navigation";

import { DashboardClient } from "./client";
import { getBootState } from "@/lib/actions/boot-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    const boot = await getBootState();
    if (!boot) redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.TALENT_DASHBOARD)}`);

    if (boot.needsOnboarding) redirect(ONBOARDING_PATH);
    if (boot.nextPath !== PATHS.TALENT_DASHBOARD) redirect(boot.nextPath);

    return <DashboardClient />;
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
