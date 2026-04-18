import { notFound, redirect } from "next/navigation";

import { PostGigClient } from "@/app/post-gig/post-gig-client";
import { getBootState } from "@/lib/actions/boot-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { referenceLinksToFormRows } from "@/lib/gig-reference-links";
import { isRedirectError } from "@/lib/is-redirect-error";
import { categoryForOpportunitySelect } from "@/lib/opportunity-form-helpers";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { formatDateForDateInput, formatDeadlineForDatetimeLocal } from "@/lib/utils/date-form";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ClientEditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gigId } = await params;

  try {
    const boot = await getBootState();
    if (!boot) {
      redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(`/client/gigs/${gigId}/edit`)}`);
    }

    if (boot.needsOnboarding) redirect(ONBOARDING_PATH);

    if (boot.nextPath !== "/client/dashboard" && !boot.nextPath.startsWith("/client/")) {
      redirect(boot.nextPath);
    }

    const supabase = await createSupabaseServer();

    const [
      { data: gig, error: gigError },
      { data: completedBooking, error: completedBookingError },
      applicationsCountResult,
    ] = await Promise.all([
      supabase
        .from("gigs")
        .select(
          "id,client_id,title,description,category,location,compensation,duration,date,application_deadline,status,reference_links"
        )
        .eq("id", gigId)
        .maybeSingle(),
      supabase.from("bookings").select("id").eq("gig_id", gigId).eq("status", "completed").limit(1).maybeSingle(),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("gig_id", gigId),
    ]);

    if (gigError) {
      logger.error("[client/gigs/edit] gig fetch error", gigError);
      notFound();
    }

    if (!gig || gig.client_id !== boot.userId) {
      notFound();
    }

    if (completedBookingError) {
      logger.error("[client/gigs/edit] completed booking check error", completedBookingError, { gigId });
    }
    if (applicationsCountResult.error) {
      logger.error("[client/gigs/edit] applications count error", applicationsCountResult.error, { gigId });
    }

    const hasCompletedBooking =
      Boolean(completedBookingError) || Boolean(completedBooking);
    const hasApplications =
      Boolean(applicationsCountResult.error) || (applicationsCountResult.count ?? 0) > 0;

    if (hasCompletedBooking) {
      return (
        <PostGigClient
          mode="edit"
          gigId={gigId}
          editLocked
          editLockedReason="This opportunity can’t be edited because it has a completed booking. If you need to make changes, contact support."
        />
      );
    }

    const initialValues = {
      title: gig.title,
      description: gig.description,
      category: categoryForOpportunitySelect(gig.category),
      location: gig.location,
      compensation: gig.compensation,
      duration: gig.duration,
      date: formatDateForDateInput(gig.date),
      application_deadline: formatDeadlineForDatetimeLocal(gig.application_deadline),
      referenceLinks: referenceLinksToFormRows(gig.reference_links),
    };

    return (
      <PostGigClient
        mode="edit"
        gigId={gigId}
        initialValues={initialValues}
        hasApplications={hasApplications}
      />
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logger.error("[client/gigs/edit] Error in server component", error);
    redirect(`${PATHS.LOGIN}?returnUrl=${encodeURIComponent(`/client/gigs/${gigId}/edit`)}`);
  }
}
