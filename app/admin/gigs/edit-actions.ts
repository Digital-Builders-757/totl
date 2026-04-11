"use server";

import { revalidatePath } from "next/cache";

import type { GigReferenceLinkFormRow } from "@/lib/gig-reference-links";
import { parseReferenceLinksForDatabase } from "@/lib/gig-reference-links";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type GigUpdate = Database["public"]["Tables"]["gigs"]["Update"];

export async function updateGigAsAdminAction(input: {
  gigId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  compensation: string;
  duration: string;
  date: string;
  application_deadline?: string | null;
  referenceLinks?: GigReferenceLinkFormRow[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
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

  if (profileError) {
    logger.error("[updateGigAsAdminAction] profile lookup failed", profileError);
    return { ok: false, error: "Unable to verify permissions." };
  }

  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Not allowed" };
  }

  const { data: gigRow, error: gigFetchError } = await supabase
    .from("gigs")
    .select("id")
    .eq("id", input.gigId)
    .maybeSingle();

  if (gigFetchError || !gigRow) {
    return { ok: false, error: "Opportunity not found" };
  }

  const linksResult = parseReferenceLinksForDatabase(input.referenceLinks ?? []);
  if (!linksResult.ok) {
    return { ok: false, error: linksResult.error };
  }

  const updatePayload: Pick<
    GigUpdate,
    | "title"
    | "description"
    | "category"
    | "location"
    | "compensation"
    | "duration"
    | "date"
    | "application_deadline"
    | "reference_links"
  > = {
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    compensation: input.compensation,
    duration: input.duration,
    date: input.date,
    application_deadline: input.application_deadline?.trim()
      ? input.application_deadline.trim()
      : null,
    reference_links: linksResult.data,
  };

  const { error: gigUpdateError } = await supabase.from("gigs").update(updatePayload).eq("id", input.gigId);

  if (gigUpdateError) {
    logger.error("[updateGigAsAdminAction] update failed", gigUpdateError);
    return { ok: false, error: gigUpdateError.message ?? "Failed to update opportunity" };
  }

  revalidatePath("/");
  revalidatePath("/admin/gigs");
  revalidatePath(`/admin/gigs/${input.gigId}`);
  revalidatePath("/client/dashboard");
  revalidatePath("/client/gigs");
  revalidatePath("/gigs");
  revalidatePath(`/gigs/${input.gigId}`);

  return { ok: true };
}
