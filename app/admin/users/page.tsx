import { redirect } from "next/navigation";
import { AdminUsersClient } from "./admin-users-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { type ProfileRow } from "@/types/database-helpers";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/users");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id as string)
    .single();

  if (userError || (userData as ProfileRow)?.role !== "admin") {
    redirect("/login?returnUrl=/admin/users");
  }

  // Fetch all users with their profiles and talent profiles (if applicable)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(`
      id,
      role,
      display_name,
      avatar_url,
      avatar_path,
      email_verified,
      created_at,
      updated_at,
      talent_profiles!left(first_name, last_name)
    `)
    .order("created_at", { ascending: false });

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return <AdminUsersClient users={[]} user={user} />;
  }

  // Type assertion needed because Supabase join types don't match exactly  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AdminUsersClient users={(profiles || []) as any} user={user} />;
}

