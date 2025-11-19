import { redirect } from "next/navigation";
import { AdminTalentClient } from "./admin-talent-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { type ProfileRow } from "@/types/database-helpers";

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
    console.error("Error fetching talent profiles:", talentError);
    return <AdminTalentClient talent={[]} user={user} />;
  }

  // Type assertion needed because Supabase join types don't match exactly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AdminTalentClient talent={(talentProfiles || []) as any} user={user} />;
}

