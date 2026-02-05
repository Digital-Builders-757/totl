import { redirect } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import { AdminTalentClient } from "./admin-talent-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { type ProfileRow } from "@/types/database-helpers";

type TalentProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  experience: string | null;
  experience_years: number | null;
  specialties: string[] | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    avatar_path: string | null;
    email_verified: boolean;
    created_at: string;
  };
};

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminTalentPage() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/talent");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/talent");
  }

  // Fetch all talent profiles with joined profile data
  const { data: talentProfiles, error: talentError } = await supabase
    .from("talent_profiles")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      location,
      experience,
      experience_years,
      specialties,
      portfolio_url,
      created_at,
      updated_at,
      profiles!inner(
        id,
        display_name,
        avatar_url,
        avatar_path,
        email_verified,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (talentError) {
    logger.error("Error fetching talent profiles", talentError);
    return <AdminTalentClient talent={[]} user={user} />;
  }

  return <AdminTalentClient talent={(talentProfiles || []) as TalentProfile[]} user={user} />;
}

