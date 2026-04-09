import { notFound, redirect } from "next/navigation";

import { PostGigClient } from "@/app/post-gig/post-gig-client";
import { AdminHeader } from "@/components/admin/admin-header";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import { type ProfileRow } from "@/types/database-helpers";

export const dynamic = "force-dynamic";

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

interface AdminEditGigPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditGigPage({ params }: AdminEditGigPageProps) {
  const { id: gigId } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?returnUrl=${encodeURIComponent(`/admin/gigs/${gigId}/edit`)}`);
  }

  const { data: userData, error: userError } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect(`/login?returnUrl=${encodeURIComponent(`/admin/gigs/${gigId}/edit`)}`);
  }

  const [{ data: gig, error: gigError }, applicationsCountResult, { data: completedBooking }] = await Promise.all([
    supabase
      .from("gigs")
      .select(
        "id,client_id,title,description,category,location,compensation,duration,date,application_deadline,status"
      )
      .eq("id", gigId)
      .maybeSingle(),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("gig_id", gigId),
    supabase.from("bookings").select("id").eq("gig_id", gigId).eq("status", "completed").limit(1).maybeSingle(),
  ]);

  if (gigError) {
    logger.error("[admin/gigs/edit] gig fetch error", gigError, { gigId });
    notFound();
  }

  if (!gig) {
    notFound();
  }

  const applicationsCount = applicationsCountResult.count ?? 0;
  const hasApplications = applicationsCount > 0;
  const hasCompletedBookings = Boolean(completedBooking);

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
    <>
      <AdminHeader user={user} />
      <PostGigClient
        mode="edit"
        gigId={gigId}
        surface="admin"
        initialValues={initialValues}
        hasApplications={hasApplications}
        hasCompletedBookings={hasCompletedBookings}
      />
    </>
  );
}
