import { redirect } from "next/navigation";

import { PostGigClient } from "@/app/post-gig/post-gig-client";
import { getBootState } from "@/lib/actions/boot-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ClientPostGigPage() {
  try {
    const boot = await getBootState();
    if (!boot) {
      redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent("/client/post-gig")}`);
    }

    if (boot.needsOnboarding) redirect(ONBOARDING_PATH);

    // Enforce role/path gating to avoid cross-role chrome leaks.
    if (boot.nextPath !== "/client/dashboard" && !boot.nextPath.startsWith("/client/")) {
      redirect(boot.nextPath);
    }

    return <PostGigClient />;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logger.error("[client/post-gig] Error in server component", error);
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent("/client/post-gig")}`);
  }
}
