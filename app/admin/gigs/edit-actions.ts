"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import type { GigReferenceLinkFormRow } from "@/lib/gig-reference-links";
import { parseReferenceLinksForDatabase } from "@/lib/gig-reference-links";
import { validateClientOpportunityRequired } from "@/lib/opportunity-form-helpers";
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

  const validated = validateClientOpportunityRequired({
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    duration: input.duration,
    compensation: input.compensation,
    date: input.date,
  });

  if (!validated.ok) {
    logger.warn("[updateGigAsAdminAction] Required field validation failed", {
      surface: "admin-edit",
      mode: "edit",
      gigId: input.gigId,
      validation: "required_fields",
      missingFields: validated.missingFields,
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
    });
    return { ok: false, error: validated.message };
  }

  const v = validated.data;

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
    logger.warn("[updateGigAsAdminAction] Reference links validation failed", {
      surface: "admin-edit",
      mode: "edit",
      gigId: input.gigId,
      validation: "reference_links",
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
    });
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
    title: v.title,
    description: v.description,
    category: v.category,
    location: v.location,
    compensation: v.compensation,
    duration: v.duration,
    date: v.date,
    application_deadline: input.application_deadline?.trim()
      ? input.application_deadline.trim()
      : null,
    reference_links: linksResult.data,
  };

  const { error: gigUpdateError } = await supabase.from("gigs").update(updatePayload).eq("id", input.gigId);

  if (gigUpdateError) {
    const debugId = randomUUID().replace(/-/g, "").slice(0, 12);
    logger.error("[updateGigAsAdminAction] update failed", gigUpdateError, {
      surface: "admin-edit",
      mode: "edit",
      gigId: input.gigId,
      validation: "database_update",
      debugId,
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
    });
    return { ok: false, error: `Could not save changes. (Ref: ${debugId})` };
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
