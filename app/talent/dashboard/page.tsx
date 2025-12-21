import { redirect } from "next/navigation";

import { DashboardClient } from "./client";
import { getBootState } from "@/lib/actions/boot-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const boot = await getBootState();
  if (!boot) redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(PATHS.TALENT_DASHBOARD)}`);

  if (boot.needsOnboarding) redirect(ONBOARDING_PATH);
  if (boot.nextPath !== PATHS.TALENT_DASHBOARD) redirect(boot.nextPath);

  return <DashboardClient />;
}

