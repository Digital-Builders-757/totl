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
  suspension_reason?: string | null;
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
  career_builder_application_status?: string | null;
  career_builder_referral_source?: string | null;
  career_builder_invite_timestamp?: string | null;
  career_builder_invited_by_name?: string | null;
};

/** Explicit FK avoids ambiguous embed errors when querying profiles → talent_profiles. */
const PROFILE_LIST_SELECT = `
  id,
  role,
  display_name,
  is_suspended,
  suspension_reason,
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

const PROFILE_LIST_SELECT_FALLBACK = PROFILE_LIST_SELECT.replace("  suspension_reason,\n", "");

function describeQueryError(err: { message?: string; code?: string }): string {
  const msg = err.message?.trim() || "Failed to load users.";
  const code = err.code ? ` (${err.code})` : "";
  return `${msg}${code}`;
}

function isMissingColumnError(error: { message?: string } | null, columnName: string): boolean {
  const message = String(error?.message ?? "");
  return /column/i.test(message) && message.includes(columnName);
}

function parseInviteMetadata(rawUserMetadata: unknown): {
  invitedByAdminId: string | null;
  inviteTimestamp: string | null;
} {
  const metadata =
    rawUserMetadata && typeof rawUserMetadata === "object"
      ? (rawUserMetadata as Record<string, unknown>)
      : null;
  if (!metadata) return { invitedByAdminId: null, inviteTimestamp: null };

  const invitedByAdminIdRaw =
    typeof metadata.invited_by_admin_id === "string" ? metadata.invited_by_admin_id.trim() : "";
  const invitedByAdminId = invitedByAdminIdRaw.length > 0 ? invitedByAdminIdRaw : null;

  const invitedAtRaw = typeof metadata.invited_at === "string" ? metadata.invited_at.trim() : "";
  const invitedAtMs = invitedAtRaw ? Date.parse(invitedAtRaw) : Number.NaN;
  const inviteTimestamp =
    Number.isNaN(invitedAtMs) || invitedAtMs <= 0 ? null : new Date(invitedAtMs).toISOString();

  return { invitedByAdminId, inviteTimestamp };
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

  const sessionFetchPrimary = await supabase
    .from("profiles")
    .select(PROFILE_LIST_SELECT)
    .order("created_at", { ascending: false });
  let sessionProfilesData = sessionFetchPrimary.data as unknown[] | null;
  let sessionProfilesError = sessionFetchPrimary.error as { message?: string; code?: string } | null;

  if (sessionProfilesError && isMissingColumnError(sessionProfilesError, "suspension_reason")) {
    const sessionFetchFallback = await supabase
      .from("profiles")
      .select(PROFILE_LIST_SELECT_FALLBACK)
      .order("created_at", { ascending: false });
    sessionProfilesData = sessionFetchFallback.data as unknown[] | null;
    sessionProfilesError = sessionFetchFallback.error as { message?: string; code?: string } | null;
  }

  if (sessionProfilesError) {
    logger.error("[AdminUsersPage] Session profiles fetch failed", sessionProfilesError);
    const adminFetchPrimary = await supabaseAdmin
      .from("profiles")
      .select(PROFILE_LIST_SELECT)
      .order("created_at", { ascending: false });
    let adminProfilesData = adminFetchPrimary.data as unknown[] | null;
    let adminProfilesError = adminFetchPrimary.error as { message?: string; code?: string } | null;

    if (adminProfilesError && isMissingColumnError(adminProfilesError, "suspension_reason")) {
      const adminFetchFallback = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_LIST_SELECT_FALLBACK)
        .order("created_at", { ascending: false });
      adminProfilesData = adminFetchFallback.data as unknown[] | null;
      adminProfilesError = adminFetchFallback.error as { message?: string; code?: string } | null;
    }

    if (adminProfilesError) {
      logger.error("[AdminUsersPage] Admin profiles fetch failed", adminProfilesError);
      loadError = describeQueryError(sessionProfilesError);
      profiles = [];
    } else {
      profiles = (adminProfilesData ?? []) as UserProfile[];
    }
  } else {
    profiles = (sessionProfilesData ?? []) as UserProfile[];
  }

  if (!profiles) {
    profiles = [];
  }

  let authUsers: Array<{ id: string; email_confirmed_at: string | null | undefined; user_metadata: unknown }> = [];

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
      authUsers = data.users.map((authUser) => ({
        id: authUser.id,
        email_confirmed_at: authUser.email_confirmed_at,
        user_metadata: authUser.user_metadata,
      }));
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

        const refetchSessionPrimary = await supabase
          .from("profiles")
          .select(PROFILE_LIST_SELECT)
          .order("created_at", { ascending: false });
        let refetchSessionData = refetchSessionPrimary.data as unknown[] | null;
        let refetchSessionError = refetchSessionPrimary.error as { message?: string; code?: string } | null;

        if (refetchSessionError && isMissingColumnError(refetchSessionError, "suspension_reason")) {
          const refetchSessionFallback = await supabase
            .from("profiles")
            .select(PROFILE_LIST_SELECT_FALLBACK)
            .order("created_at", { ascending: false });
          refetchSessionData = refetchSessionFallback.data as unknown[] | null;
          refetchSessionError = refetchSessionFallback.error as { message?: string; code?: string } | null;
        }

        if (refetchSessionError) {
          logger.error(
            "[AdminUsersPage] Error refetching profiles after sync (session)",
            refetchSessionError
          );
          const refetchAdminPrimary = await supabaseAdmin
            .from("profiles")
            .select(PROFILE_LIST_SELECT)
            .order("created_at", { ascending: false });
          let refetchAdminData = refetchAdminPrimary.data as unknown[] | null;
          let refetchAdminError = refetchAdminPrimary.error as { message?: string; code?: string } | null;

          if (refetchAdminError && isMissingColumnError(refetchAdminError, "suspension_reason")) {
            const refetchAdminFallback = await supabaseAdmin
              .from("profiles")
              .select(PROFILE_LIST_SELECT_FALLBACK)
              .order("created_at", { ascending: false });
            refetchAdminData = refetchAdminFallback.data as unknown[] | null;
            refetchAdminError = refetchAdminFallback.error as { message?: string; code?: string } | null;
          }

          if (refetchAdminError) {
            logger.error(
              "[AdminUsersPage] Error refetching profiles after sync (admin)",
              refetchAdminError
            );
            loadError =
              loadError ??
              "Could not refresh the user list after syncing email verification. You may still see slightly stale verification badges.";
          } else {
            profiles = (refetchAdminData ?? []) as UserProfile[];
          }
        } else {
          profiles = (refetchSessionData ?? []) as UserProfile[];
        }
      }
    }
  }

  const inviteMetadataByUserId = new Map<string, { invitedByAdminId: string | null; inviteTimestamp: string | null }>();
  for (const authUser of authUsers) {
    inviteMetadataByUserId.set(authUser.id, parseInviteMetadata(authUser.user_metadata));
  }

  const clientUserIds = profiles
    .filter((profile) => profile.role === "client")
    .map((profile) => profile.id);

  type ClientApplicationContext = {
    user_id: string | null;
    status: string;
    created_at: string;
    invited_by_admin_id?: string | null;
    referral_source?: string | null;
  };

  const selectWithProvenance = "user_id, status, created_at, invited_by_admin_id, referral_source";
  const selectFallback = "user_id, status, created_at";
  let clientApplicationRows: ClientApplicationContext[] = [];

  if (clientUserIds.length > 0) {
    const clientAppsPrimary = await supabaseAdmin
      .from("client_applications")
      .select(selectWithProvenance)
      .in("user_id", clientUserIds)
      .order("created_at", { ascending: false });
    let clientAppsData = clientAppsPrimary.data as unknown[] | null;
    let clientAppsError = clientAppsPrimary.error as { message?: string } | null;

    if (clientAppsError && isMissingColumnError(clientAppsError, "invited_by_admin_id")) {
      const clientAppsFallback = await supabaseAdmin
        .from("client_applications")
        .select(selectFallback)
        .in("user_id", clientUserIds)
        .order("created_at", { ascending: false });
      clientAppsData = clientAppsFallback.data as unknown[] | null;
      clientAppsError = clientAppsFallback.error as { message?: string } | null;
    }

    if (clientAppsError) {
      logger.error("[AdminUsersPage] Failed to fetch client application context", clientAppsError, {
        userCount: clientUserIds.length,
      });
    } else {
      clientApplicationRows = (clientAppsData ?? []) as unknown as ClientApplicationContext[];
    }
  }

  const latestClientApplicationByUserId = new Map<string, ClientApplicationContext>();
  for (const row of clientApplicationRows) {
    if (!row.user_id || latestClientApplicationByUserId.has(row.user_id)) continue;
    latestClientApplicationByUserId.set(row.user_id, row);
  }

  const inviterIds = Array.from(
    new Set(
      Array.from(latestClientApplicationByUserId.values())
        .map((row) => row.invited_by_admin_id)
        .concat(Array.from(inviteMetadataByUserId.values()).map((meta) => meta.invitedByAdminId))
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const inviterNameById = new Map<string, string>();
  if (inviterIds.length > 0) {
    const { data: inviterProfiles, error: inviterError } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", inviterIds);

    if (inviterError) {
      logger.error("[AdminUsersPage] Failed to fetch inviter names", inviterError, {
        inviterCount: inviterIds.length,
      });
    } else {
      for (const profile of inviterProfiles ?? []) {
        const label = profile.display_name?.trim();
        inviterNameById.set(profile.id, label && label.length > 0 ? label : profile.id.slice(0, 8));
      }
    }
  }

  profiles = profiles.map((profile) => {
    if (profile.role !== "client") return profile;
    const latestClientApplication = latestClientApplicationByUserId.get(profile.id);
    const inviteMetadata = inviteMetadataByUserId.get(profile.id);
    const invitedByAdminId = latestClientApplication?.invited_by_admin_id ?? inviteMetadata?.invitedByAdminId ?? null;

    return {
      ...profile,
      career_builder_application_status: latestClientApplication?.status ?? null,
      career_builder_referral_source: latestClientApplication?.referral_source ?? null,
      career_builder_invite_timestamp: inviteMetadata?.inviteTimestamp ?? null,
      career_builder_invited_by_name: invitedByAdminId ? inviterNameById.get(invitedByAdminId) ?? null : null,
    };
  });

  return (
    <AdminUsersClient
      users={profiles}
      user={user}
      loadError={loadError}
    />
  );
}
