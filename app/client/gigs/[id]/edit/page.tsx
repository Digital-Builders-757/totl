import { notFound, redirect } from "next/navigation";

import { PostGigClient } from "@/app/post-gig/post-gig-client";
import { getBootState } from "@/lib/actions/boot-actions";
import { ONBOARDING_PATH, PATHS } from "@/lib/constants/routes";
import { isRedirectError } from "@/lib/is-redirect-error";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDateForDateInput(date: string): string {
  if (!date) return "";
  return date.length >= 10 ? date.slice(0, 10) : date;
}

function formatDeadlineForDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

    const [{ data: gig, error: gigError }, { data: completedBooking }, applicationsCountResult] =
      await Promise.all([
        supabase
          .from("gigs")
          .select(
            "id,client_id,title,description,category,location,compensation,duration,date,application_deadline,status"
          )
          .eq("id", gigId)
          .maybeSingle(),
        supabase.from("bookings").select("id").eq("gig_id", gigId).eq("status", "completed").limit(1).maybeSingle(),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("gig_id", gigId),
      ]);

    if (gigError) {
      logger.error("[client/gigs/edit] gig fetch error", gigError);
      notFound();
    }

    if (!gig || gig.client_id !== boot.userId) {
      notFound();
    }

    const hasCompletedBooking = Boolean(completedBooking);
    const applicationsCount = applicationsCountResult.count ?? 0;
    const hasApplications = applicationsCount > 0;

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
      category: gig.category,
      location: gig.location,
      compensation: gig.compensation,
      duration: gig.duration,
      date: formatDateForDateInput(gig.date),
      application_deadline: formatDeadlineForDatetimeLocal(gig.application_deadline),
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
