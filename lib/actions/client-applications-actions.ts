"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

type ClientApplicationRow = {
  id: string;
  gig_id: string;
  talent_id: string;
  status: "new" | "under_review" | "shortlisted" | "rejected" | "accepted";
  message: string | null;
  created_at: string;
  updated_at: string;
  gigs?: {
    title: string;
    category?: string;
    location: string;
    compensation: string;
  };
  profiles?: {
    display_name: string | null;
    email_verified: boolean;
    role: string;
    avatar_url: string | null;
    avatar_path: string | null;
  };
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

export async function getClientApplications() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized" };
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
      return { error: "Failed to load applications" };
    }

    const rows = (applications ?? []) as ClientApplicationRow[];
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

    return { success: true, userId: user.id, applications: applicationsWithTalent };
  } catch (error) {
    logger.error("Unexpected error fetching client applications", error);
    return { error: "An unexpected error occurred" };
  }
}
