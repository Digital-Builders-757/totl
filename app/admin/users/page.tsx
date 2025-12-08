import { redirect } from "next/navigation";
import { AdminUsersClient } from "./admin-users-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { type ProfileRow } from "@/types/database-helpers";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();

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

  // Sync email verification status from auth.users.email_confirmed_at to profiles.email_verified
  // This ensures the admin dashboard shows accurate verification status
  if (profiles && profiles.length > 0) {
    // Get email confirmation status from auth.users for all profiles
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsers?.users) {
      const updates: Array<{ id: string; email_verified: boolean }> = [];
      
      for (const profile of profiles) {
        const authUser = authUsers.users.find((u) => u.id === profile.id);
        if (authUser) {
          const isEmailVerified = authUser.email_confirmed_at !== null;
          // Only update if there's a mismatch
          if (profile.email_verified !== isEmailVerified) {
            updates.push({ id: profile.id, email_verified: isEmailVerified });
          }
        }
      }
      
      // Batch update profiles with correct email verification status
      if (updates.length > 0) {
        for (const update of updates) {
          await supabaseAdmin
            .from("profiles")
            .update({ email_verified: update.email_verified })
            .eq("id", update.id);
        }
        
        // Re-fetch profiles after sync
        const { data: syncedProfiles } = await supabase
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
        
        if (syncedProfiles) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return <AdminUsersClient users={syncedProfiles as any} user={user} />;
        }
      }
    }
  }

  // Type assertion needed because Supabase join types don't match exactly  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AdminUsersClient users={(profiles || []) as any} user={user} />;
}

