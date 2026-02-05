import { redirect } from "next/navigation";
import { AdminUsersClient } from "./admin-users-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";
import { type ProfileRow } from "@/types/database-helpers";

type UserProfile = {
  id: string;
  role: "talent" | "client" | "admin";
  display_name: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  email_verified: boolean | null;
  created_at: string;
  updated_at: string;
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

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
    logger.error("Error fetching profiles", profilesError);
    return <AdminUsersClient users={[]} user={user} />;
  }

  // Sync email verification status from auth.users.email_confirmed_at to profiles.email_verified
  // This ensures the admin dashboard shows accurate verification status
  if (profiles && profiles.length > 0) {
    // Pull a large page so we don't miss users due to pagination limits
    const {
      data,
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      logger.error("[AdminUsersPage] Error listing auth users", listError);
    } else if (data?.users) {
      const authUsers = data.users;
      const updates: Array<{ id: string; email_verified: boolean }> = [];

      for (const profile of profiles) {
        const authUser = authUsers.find((u) => u.id === profile.id);
        if (!authUser) continue;

        const isEmailVerified = authUser.email_confirmed_at !== null;
        if (profile.email_verified !== isEmailVerified) {
          updates.push({ id: profile.id, email_verified: isEmailVerified });
        }
      }

      if (updates.length > 0) {
        for (const update of updates) {
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ email_verified: update.email_verified })
            .eq("id", update.id);

          if (updateError) {
            logger.error(
              "[AdminUsersPage] Error updating email_verified for profile",
              updateError,
              { profileId: update.id }
            );
          }
        }

        // Re-fetch profiles after sync
        const { data: syncedProfiles, error: refetchError } = await supabase
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

        if (refetchError) {
          logger.error(
            "[AdminUsersPage] Error refetching profiles after sync",
            refetchError
          );
        } else if (syncedProfiles) {
          return <AdminUsersClient users={syncedProfiles as UserProfile[]} user={user} />;
        }
      }
    }
  }

  return <AdminUsersClient users={(profiles || []) as UserProfile[]} user={user} />;
}

