import ClientApplicationsClient, {
  type Application,
} from "@/app/client/applications/client-applications-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export default async function ClientApplicationsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return <ClientApplicationsClient initialApplications={[]} />;
  }

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
      gigs!inner(title, category, location, compensation),
      profiles!talent_id(display_name, email_verified, role, avatar_url, avatar_path)
    `
    )
    .eq("gigs.client_id", user.id)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    logger.error("Error fetching client applications", applicationsError);
    return <ClientApplicationsClient initialApplications={[]} />;
  }

  const rows = (applications ?? []) as Application[];
  const talentIds = Array.from(new Set(rows.map((app) => app.talent_id).filter(Boolean)));

  const talentProfileByUserId = new Map<string, { first_name: string; last_name: string }>();
  if (talentIds.length > 0) {
    const { data: talentProfiles, error: talentProfilesError } = await supabase
      .from("talent_profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", talentIds);

    if (talentProfilesError) {
      logger.error("Error fetching talent profiles for client applications", talentProfilesError);
    } else {
      (talentProfiles ?? []).forEach((profile) => {
        talentProfileByUserId.set(profile.user_id, {
          first_name: profile.first_name,
          last_name: profile.last_name,
        });
      });
    }
  }

  const applicationsWithTalent = rows.map((app) => ({
    ...app,
    talent_profiles: talentProfileByUserId.get(app.talent_id) || null,
  }));

  return <ClientApplicationsClient initialApplications={applicationsWithTalent} />;
}
