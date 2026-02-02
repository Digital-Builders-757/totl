import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { logger } from "@/lib/utils/logger";
import { AdminModerationClient } from "./admin-moderation-client";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { ContentFlagRow, ModerationDatabase } from "@/lib/types/moderation";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?returnUrl=/admin/moderation");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    redirect("/login?returnUrl=/admin/moderation");
  }

  type FlagRow = ContentFlagRow & {
    reporter: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
    assigned_admin: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
    gig: (Pick<
      Database["public"]["Tables"]["gigs"]["Row"],
      "id" | "title" | "status" | "location" | "compensation" | "category" | "client_id"
    > & {
      client_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
    }) | null;
  };

  const typedSupabase = supabase as SupabaseClient<ModerationDatabase>;

  const { data: flags, error: flagsError } = await typedSupabase
    .from("content_flags")
    .select(
      `
        id,
        resource_type,
        resource_id,
        gig_id,
        reason,
        details,
        status,
        admin_notes,
        assigned_admin_id,
        resolution_action,
        created_at,
        updated_at,
        resolved_at,
        reporter:reporter_id ( id, display_name ),
        assigned_admin:assigned_admin_id ( id, display_name ),
        gig:gig_id (
          id,
          title,
          status,
          location,
          compensation,
          category,
          client_id,
          client_profile:client_id ( id, display_name )
        )
      `
    )
    .order("created_at", { ascending: false });

  const missingTableNotice =
    "Moderation is not configured in this environment yet. Run the moderation migration to create public.content_flags.";

  const isMissingContentFlagsTable = (
    error: { code?: string; message?: string; details?: string; hint?: string } | null
  ) => {
    if (!error) return false;
    if (error.code === "42P01") return true;
    const combinedMessage = [error.message, error.details, error.hint].filter(Boolean).join(" ").toLowerCase();
    return combinedMessage.includes("content_flags") && combinedMessage.includes("does not exist");
  };

  if (flagsError) {
    if (isMissingContentFlagsTable(flagsError)) {
      logger.error("Moderation table missing in this environment: public.content_flags", flagsError, {
        route: "/admin/moderation",
      });
      return <AdminModerationClient flags={[]} user={user} notice={missingTableNotice} />;
    }
    logger.error("Error loading moderation flags", flagsError);
    return <AdminModerationClient flags={[]} user={user} />;
  }

  type TargetProfile = Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "display_name" | "role" | "is_suspended" | "suspension_reason"
  >;

  const profileTargetIds = Array.from(
    new Set(
      (flags ?? [])
        .filter((flag) => flag.resource_type === "talent_profile" || flag.resource_type === "client_profile")
        .map((flag) => flag.resource_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let targetProfilesById = new Map<string, TargetProfile>();
  if (profileTargetIds.length > 0) {
    const { data: targetProfiles, error: targetProfilesError } = await supabase
      .from("profiles")
      .select("id, display_name, role, is_suspended, suspension_reason")
      .in("id", profileTargetIds);

    if (targetProfilesError) {
      logger.error("Error loading moderation target profiles", targetProfilesError);
    } else if (targetProfiles) {
      targetProfilesById = new Map(targetProfiles.map((profile) => [profile.id, profile]));
    }
  }

  const normalizedFlags = (((flags ?? []) as unknown) as FlagRow[]).map((flag) => ({
    ...flag,
    target_profile:
      flag.resource_type === "talent_profile" || flag.resource_type === "client_profile"
        ? targetProfilesById.get(flag.resource_id) ?? null
        : null,
  }));

  return <AdminModerationClient flags={normalizedFlags} user={user} />;
}

