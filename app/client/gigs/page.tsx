import { redirect } from "next/navigation";
import ClientGigsClient from "./client";
import { getBootState } from "@/lib/actions/boot-actions";
import { getClientGigs, type ClientGig } from "@/lib/actions/client-gigs-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
const CLIENT_GIGS_PATH = "/client/gigs";

export default async function Page() {
  try {
    const boot = await getBootState();
    if (!boot) redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(CLIENT_GIGS_PATH)}`);
    if (boot.needsOnboarding) redirect(ONBOARDING_PATH);
    if (boot.nextPath !== PATHS.CLIENT_DASHBOARD && boot.nextPath !== CLIENT_GIGS_PATH) {
      redirect(boot.nextPath);
    }

    const gigsResult = await getClientGigs();
    const initialGigs = gigsResult.gigs ?? [];

    return <ClientGigsClient userId={boot.userId} initialGigs={initialGigs as ClientGig[]} />;
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    logger.error("[client/gigs] Error in server component", error);
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(CLIENT_GIGS_PATH)}`);
  }
}
