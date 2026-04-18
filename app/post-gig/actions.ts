"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { uploadGigImage } from "@/lib/actions/gig-actions";
import type { GigReferenceLinkFormRow } from "@/lib/gig-reference-links";
import { parseReferenceLinksForDatabase } from "@/lib/gig-reference-links";
import { validateClientOpportunityRequired } from "@/lib/opportunity-form-helpers";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

type GigInsert = Database["public"]["Tables"]["gigs"]["Insert"];
type GigUpdate = Database["public"]["Tables"]["gigs"]["Update"];

export async function createGigAction(input: {
  title: string;
  description: string;
  category: string;
  location: string;
  compensation: string;
  duration: string;
  date: string;
  application_deadline?: string | null;
  imageFile?: File | null;
  referenceLinks?: GigReferenceLinkFormRow[];
}): Promise<{ ok: true; gigId: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Not authenticated" };

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
    logger.warn("[createGigAction] Required field validation failed", {
      surface: "client-create",
      mode: "create",
      validation: "required_fields",
      missingFields: validated.missingFields,
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
      hasImageAttempt: Boolean(input.imageFile && input.imageFile.size > 0),
    });
    return { ok: false, error: validated.message };
  }

  const v = validated.data;

  // Upload image if provided (before DB insert to enable cleanup on failure)
  let imageUrl: string | null = null;
  if (input.imageFile && input.imageFile.size > 0) {
    const uploadResult = await uploadGigImage(input.imageFile);
    if (!uploadResult.ok) {
      // Include debug_id in error message for tracing
      const errorMsg = uploadResult.debug_id
        ? `${uploadResult.message} (Debug ID: ${uploadResult.debug_id})`
        : uploadResult.message;
      return { ok: false, error: errorMsg };
    }
    imageUrl = uploadResult.url;
  }

  const linksResult = parseReferenceLinksForDatabase(input.referenceLinks ?? []);
  if (!linksResult.ok) {
    if (imageUrl) {
      const { deleteGigImage } = await import("@/lib/actions/gig-actions");
      await deleteGigImage(imageUrl);
    }
    logger.warn("[createGigAction] Reference links validation failed", {
      surface: "client-create",
      mode: "create",
      validation: "reference_links",
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
      hasImageAttempt: Boolean(imageUrl),
    });
    return { ok: false, error: linksResult.error };
  }

  const payload: GigInsert = {
    client_id: user.id,
    title: v.title,
    description: v.description,
    category: v.category,
    location: v.location,
    compensation: v.compensation,
    duration: v.duration,
    date: v.date,
    application_deadline: input.application_deadline ?? null,
    image_url: imageUrl,
    status: "active",
    reference_links: linksResult.data,
  };

  const { data, error } = await supabase
    .from("gigs")
    .insert(payload)
    .select("id")
    .single();

  // If DB insert fails but image was uploaded, clean up orphaned image
  if ((error || !data) && imageUrl) {
    const { deleteGigImage } = await import("@/lib/actions/gig-actions");
    await deleteGigImage(imageUrl);
    const debugId = randomUUID().replace(/-/g, "").slice(0, 12);
    logger.error("[createGigAction] Insert failed after upload", error, {
      surface: "client-create",
      mode: "create",
      validation: "database_insert",
      debugId,
      hadUploadedImage: true,
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
    });
    return {
      ok: false,
      error: `Failed to create opportunity. (Ref: ${debugId})`,
    };
  }

  if (error || !data) {
    const debugId = randomUUID().replace(/-/g, "").slice(0, 12);
    logger.error("[createGigAction] Insert failed", error, {
      surface: "client-create",
      mode: "create",
      validation: "database_insert",
      debugId,
      hadUploadedImage: Boolean(imageUrl),
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
    });
    return {
      ok: false,
      error: `Failed to create opportunity. (Ref: ${debugId})`,
    };
  }

  revalidatePath("/");
  revalidatePath("/gigs");

  return { ok: true, gigId: data.id };
}

export async function updateGigAction(input: {
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
    logger.warn("[updateGigAction] Required field validation failed", {
      surface: "client-edit",
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
    .select("id,client_id,status")
    .eq("id", input.gigId)
    .maybeSingle();

  if (gigFetchError || !gigRow) return { ok: false, error: "Opportunity not found" };
  if (gigRow.client_id !== user.id) return { ok: false, error: "Not allowed" };

  const { data: completedBooking, error: completedBookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("gig_id", input.gigId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (completedBookingError) {
    logger.error("[updateGigAction] Failed to check completed bookings", completedBookingError);
    return {
      ok: false,
      error: "Unable to verify booking status. Try again in a moment.",
    };
  }

  if (completedBooking) {
    return {
      ok: false,
      error:
        "This opportunity cannot be edited because it has a completed booking. Contact support if you need changes.",
    };
  }

  const linksResult = parseReferenceLinksForDatabase(input.referenceLinks ?? []);
  if (!linksResult.ok) {
    logger.warn("[updateGigAction] Reference links validation failed", {
      surface: "client-edit",
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

  const { error: gigUpdateError } = await supabase
    .from("gigs")
    .update(updatePayload)
    .eq("id", input.gigId)
    .eq("client_id", user.id);

  if (gigUpdateError) {
    const debugId = randomUUID().replace(/-/g, "").slice(0, 12);
    logger.error("[updateGigAction] Update failed", gigUpdateError, {
      surface: "client-edit",
      mode: "edit",
      gigId: input.gigId,
      validation: "database_update",
      debugId,
      referenceLinkRowCount: input.referenceLinks?.length ?? 0,
    });
    return {
      ok: false,
      error: `Could not save changes. (Ref: ${debugId})`,
    };
  }

  revalidatePath("/client/dashboard");
  revalidatePath("/gigs");
  revalidatePath(`/gigs/${input.gigId}`);

  return { ok: true };
}


