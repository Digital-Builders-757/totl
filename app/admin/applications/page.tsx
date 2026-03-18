import { redirect } from "next/navigation";
import { AdminApplicationsClient } from "./admin-applications-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import { type ProfileRow } from "@/types/database-helpers";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/applications");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/applications");
  }

  // Fetch applications + joined opportunity title
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select(
      `
      id,
      gig_id,
      talent_id,
      status,
      message,
      created_at,
      updated_at,
      gigs ( id, title, location )
    `
    )
    .order("created_at", { ascending: false });

  if (applicationsError) {
    logger.error("Error fetching applications", applicationsError);
    return <AdminApplicationsClient applications={[]} user={user} />;
  }

  const talentIds = Array.from(new Set((applications ?? []).map((a) => a.talent_id).filter(Boolean)));

  const { data: talentProfiles } = talentIds.length
    ? await supabase
        .from("talent_profiles")
        .select("user_id, first_name, last_name, location")
        .in("user_id", talentIds)
    : {
        data: [] as Array<{
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          location: string | null;
        }>,
      };

  const talentById = new Map((talentProfiles ?? []).map((t) => [t.user_id, t]));

  const transformedApplications = (applications ?? []).map((app) => {
    const t = talentById.get(app.talent_id);
    const talentName = t ? `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() : "";

    return {
      ...app,
      gigs: app.gigs ?? null,
      talent: t
        ? {
            id: t.user_id,
            name: talentName || "Unknown",
            location: t.location,
          }
        : {
            id: app.talent_id,
            name: "Unknown",
            location: null,
          },
    };
  });

  return <AdminApplicationsClient applications={transformedApplications} user={user} />;
}
