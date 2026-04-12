"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

function revalidateGigSurfaces(gigId: string) {
  revalidatePath("/");
  revalidatePath("/gigs");
  revalidatePath("/admin/gigs");
  revalidatePath(`/admin/gigs/${gigId}`);
  revalidatePath(`/gigs/${gigId}`);
}

export async function closeGigAsAdminAction(
  gigId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Not authenticated" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, error: "Not allowed" };
  }

  const { data: gigRow, error: gigFetchError } = await supabase
    .from("gigs")
    .select("id")
    .eq("id", gigId)
    .maybeSingle();

  if (gigFetchError || !gigRow) {
    return { ok: false, error: "Opportunity not found" };
  }

  const { error: updateError } = await supabase
    .from("gigs")
    .update({ status: "closed" })
    .eq("id", gigId);

  if (updateError) {
    logger.error("[closeGigAsAdminAction] update failed", updateError, { gigId });
    return { ok: false, error: updateError.message ?? "Failed to close opportunity" };
  }

  revalidateGigSurfaces(gigId);
  return { ok: true };
}

export async function deleteGigAsAdminAction(
  gigId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Not authenticated" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, error: "Not allowed" };
  }

  const { data: gigRow, error: gigFetchError } = await supabase
    .from("gigs")
    .select("id")
    .eq("id", gigId)
    .maybeSingle();

  if (gigFetchError || !gigRow) {
    return { ok: false, error: "Opportunity not found" };
  }

  const { error: deleteError } = await supabase.from("gigs").delete().eq("id", gigId);

  if (deleteError) {
    logger.error("[deleteGigAsAdminAction] delete failed", deleteError, { gigId });
    return { ok: false, error: deleteError.message ?? "Failed to delete opportunity" };
  }

  revalidateGigSurfaces(gigId);
  return { ok: true };
}
