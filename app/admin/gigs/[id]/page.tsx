import { redirect, notFound } from "next/navigation";

import { AdminGigDetailClient } from "./admin-gig-detail-client";
import { AdminHeader } from "@/components/admin/admin-header";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import { type ProfileRow } from "@/types/database-helpers";

export const dynamic = "force-dynamic";

interface AdminGigDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminGigDetailPage({ params }: AdminGigDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?returnUrl=/admin/gigs/${encodeURIComponent(id)}`);
  }

  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect(`/login?returnUrl=/admin/gigs/${encodeURIComponent(id)}`);
  }

  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select(
      `
      id,
      client_id,
      title,
      description,
      category,
      location,
      compensation,
      duration,
      date,
      application_deadline,
      status,
      image_url,
      created_at,
      updated_at
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (gigError) {
    logger.error("[admin/gigs/[id]] Error fetching opportunity", gigError, { id });
  }

  if (!gig) {
    notFound();
  }

  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("user_id, company_name, contact_name, contact_email")
    .eq("user_id", gig.client_id)
    .maybeSingle();

  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      message,
      created_at,
      talent_id
    `
    )
    .eq("gig_id", id)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    logger.error("[admin/gigs/[id]] Error fetching applications", applicationsError, { id });
  }

  const talentIds = Array.from(new Set((applications ?? []).map((a) => a.talent_id).filter(Boolean)));

  const { data: talentProfiles } = talentIds.length
    ? await supabase
        .from("talent_profiles")
        .select("user_id, first_name, last_name, location")
        .in("user_id", talentIds)
    : { data: [] as Array<{ user_id: string; first_name: string | null; last_name: string | null; location: string | null }> };

  const talentById = new Map(
    (talentProfiles ?? []).map((t) => [t.user_id, t])
  );

  const applicationsWithTalent = (applications ?? []).map((a) => {
    const t = talentById.get(a.talent_id);
    return {
      ...a,
      talent: t
        ? {
            name: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "Unknown",
            location: t.location,
          }
        : { name: "Unknown", location: null },
    };
  });

  return (
    <>
      <AdminHeader user={user} />
      <AdminGigDetailClient
        user={user}
        gig={gig}
        clientProfile={clientProfile ?? null}
        applications={applicationsWithTalent}
      />
    </>
  );
}
