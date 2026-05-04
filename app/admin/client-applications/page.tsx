import { redirect } from "next/navigation";
import { AdminClientApplicationsClient } from "./admin-client-applications-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

// Force dynamic rendering to prevent static pre-rendering
export const dynamic = "force-dynamic";

type ClientApplicationWithProvenance = Database["public"]["Tables"]["client_applications"]["Row"] & {
  invited_by_admin_id?: string | null;
  referral_source?: string | null;
  invite_timestamp?: string | null;
  invited_by_name?: string | null;
};

function isMissingProvenanceColumnError(error: { message?: string } | null): boolean {
  const message = String(error?.message ?? "");
  return /column/i.test(message) && /(invited_by_admin_id|referral_source)/i.test(message);
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

export default async function AdminClientApplicationsPage() {
  const supabase = await createSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();

  // Check if user is authenticated and is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/client-applications");
  }

  // Get user role from profiles table
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Database["public"]["Tables"]["profiles"]["Row"]["role"] }>();

  if (userError || userData?.role !== "admin") {
    redirect("/login?returnUrl=/admin/client-applications");
  }

  const baseSelect =
    "id, user_id, first_name, last_name, email, phone, company_name, industry, website, business_description, needs_description, status, admin_notes, follow_up_sent_at, created_at, updated_at";
  const provenanceSelect = `${baseSelect}, invited_by_admin_id, referral_source`;

  // Fetch client applications
  const primaryApplicationsQuery = await supabase
    .from("client_applications")
    .select(provenanceSelect)
    .order("created_at", { ascending: false });
  let applicationsData = primaryApplicationsQuery.data as unknown as ClientApplicationWithProvenance[] | null;
  let applicationsError = primaryApplicationsQuery.error as { message?: string } | null;

  if (applicationsError && isMissingProvenanceColumnError(applicationsError)) {
    const fallback = await supabase
      .from("client_applications")
      .select(baseSelect)
      .order("created_at", { ascending: false });
    applicationsData = fallback.data as unknown as ClientApplicationWithProvenance[] | null;
    applicationsError = fallback.error as { message?: string } | null;
  }

  if (applicationsError) {
    logger.error("Error fetching client applications", applicationsError);
    return <AdminClientApplicationsClient applications={[]} user={user} />;
  }

  const rawApplications = (applicationsData ?? []) as unknown as ClientApplicationWithProvenance[];

  const { data: authUsersData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authUsersError) {
    logger.error("Error fetching auth users for invite provenance", authUsersError);
  }

  const inviteMetadataByUserId = new Map<string, { invitedByAdminId: string | null; inviteTimestamp: string | null }>();
  for (const authUser of authUsersData?.users ?? []) {
    inviteMetadataByUserId.set(authUser.id, parseInviteMetadata(authUser.user_metadata));
  }

  const applicationsWithInviteMeta = rawApplications.map((application) => {
    const inviteMetadata = inviteMetadataByUserId.get(application.user_id ?? "");
    return {
      ...application,
      invited_by_admin_id: application.invited_by_admin_id ?? inviteMetadata?.invitedByAdminId ?? null,
      referral_source: application.referral_source ?? null,
      invite_timestamp: inviteMetadata?.inviteTimestamp ?? null,
    };
  });

  const inviterIds = Array.from(
    new Set(
      applicationsWithInviteMeta
        .map((application) => application.invited_by_admin_id)
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
      logger.error("Error fetching inviter profiles for client applications", inviterError, {
        inviterCount: inviterIds.length,
      });
    } else {
      for (const profile of inviterProfiles ?? []) {
        const displayName = profile.display_name?.trim();
        inviterNameById.set(profile.id, displayName && displayName.length > 0 ? displayName : profile.id.slice(0, 8));
      }
    }
  }

  const applications = applicationsWithInviteMeta.map((application) => ({
    ...application,
    invited_by_name: application.invited_by_admin_id ? inviterNameById.get(application.invited_by_admin_id) ?? null : null,
  }));

  return <AdminClientApplicationsClient applications={applications} user={user} />;
}






