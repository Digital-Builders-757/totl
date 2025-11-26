import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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

type FlagRecord = ContentFlagRow & {
    reporter: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
    assigned_admin: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
    gig: (Pick<
      Database["public"]["Tables"]["gigs"]["Row"],
      "id" | "title" | "status" | "location" | "compensation" | "category" | "client_id"
    > & {
      client_profile: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name"> | null;
    }) | null;
    target_profile:
      | (Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "display_name" | "role"> & {
          is_suspended?: boolean | null;
          suspension_reason?: string | null;
        })
      | null;
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
        target_profile:resource_id (
          id,
          display_name,
          role,
          is_suspended,
          suspension_reason
        ),
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

  if (flagsError) {
    console.error("Error loading moderation flags:", flagsError);
    return <AdminModerationClient flags={[]} user={user} />;
  }

  const normalizedFlags = ((flags ?? []) as unknown) as FlagRecord[];
  return <AdminModerationClient flags={normalizedFlags} user={user} />;
}

