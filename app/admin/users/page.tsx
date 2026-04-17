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
  is_suspended: boolean | null;
  avatar_url: string | null;
  avatar_path: string | null;
  email_verified: boolean | null;
  created_at: string;
  updated_at: string;
  subscription_status: "none" | "active" | "past_due" | "canceled";
  subscription_plan: string | null;
  subscription_current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  talent_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

/** Explicit FK avoids ambiguous embed errors when querying profiles → talent_profiles. */
const PROFILE_LIST_SELECT = `
  id,
  role,
  display_name,
  is_suspended,
  avatar_url,
  avatar_path,
  email_verified,
  created_at,
  updated_at,
  subscription_status,
  subscription_plan,
  subscription_current_period_end,
  stripe_customer_id,
  stripe_subscription_id,
  talent_profiles!talent_profiles_user_id_fkey(first_name, last_name)
`;

function describeQueryError(err: { message?: string; code?: string }): string {
  const msg = err.message?.trim() || "Failed to load users.";
  const code = err.code ? ` (${err.code})` : "";
  return `${msg}${code}`;
}

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

  let loadError: string | null = null;
  let profiles: UserProfile[] | null = null;

  const sessionFetch = await supabase
    .from("profiles")
    .select(PROFILE_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (sessionFetch.error) {
    logger.error("[AdminUsersPage] Session profiles fetch failed", sessionFetch.error);
    const adminFetch = await supabaseAdmin
      .from("profiles")
      .select(PROFILE_LIST_SELECT)
      .order("created_at", { ascending: false });

    if (adminFetch.error) {
      logger.error("[AdminUsersPage] Admin profiles fetch failed", adminFetch.error);
      loadError = describeQueryError(sessionFetch.error);
      profiles = [];
    } else {
      profiles = (adminFetch.data ?? []) as UserProfile[];
    }
  } else {
    profiles = (sessionFetch.data ?? []) as UserProfile[];
  }

  if (!profiles) {
    profiles = [];
  }

  // Sync email verification status from auth.users.email_confirmed_at to profiles.email_verified
  if (profiles.length > 0) {
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

        const refetchSession = await supabase
          .from("profiles")
          .select(PROFILE_LIST_SELECT)
          .order("created_at", { ascending: false });

        if (refetchSession.error) {
          logger.error(
            "[AdminUsersPage] Error refetching profiles after sync (session)",
            refetchSession.error
          );
          const refetchAdmin = await supabaseAdmin
            .from("profiles")
            .select(PROFILE_LIST_SELECT)
            .order("created_at", { ascending: false });

          if (refetchAdmin.error) {
            logger.error(
              "[AdminUsersPage] Error refetching profiles after sync (admin)",
              refetchAdmin.error
            );
            loadError =
              loadError ??
              "Could not refresh the user list after syncing email verification. You may still see slightly stale verification badges.";
          } else {
            profiles = (refetchAdmin.data ?? []) as UserProfile[];
          }
        } else {
          profiles = (refetchSession.data ?? []) as UserProfile[];
        }
      }
    }
  }

  return (
    <AdminUsersClient
      users={profiles}
      user={user}
      loadError={loadError}
    />
  );
}
