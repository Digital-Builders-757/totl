"use server";

import { revalidatePath } from "next/cache";

import { uploadGigImage } from "@/lib/actions/gig-actions";
import type { GigReferenceLinkFormRow } from "@/lib/gig-reference-links";
import { parseReferenceLinksForDatabase } from "@/lib/gig-reference-links";
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

  // Upload image if provided (before DB insert to enable cleanup on failure)
  let imageUrl: string | null = null;
  if (input.imageFile) {
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
    return { ok: false, error: linksResult.error };
  }

  const payload: GigInsert = {
    client_id: user.id,
    title: input.title,
    description: input.description,
    category: input.category,
    location: input.location,
    compensation: input.compensation,
    duration: input.duration,
    date: input.date,
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
    return { ok: false, error: error?.message ?? "Failed to create gig" };
  }

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create gig" };

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

  const { error: gigUpdateError } = await supabase
    .from("gigs")
    .update(updatePayload)
    .eq("id", input.gigId)
    .eq("client_id", user.id);

  if (gigUpdateError) {
    return { ok: false, error: gigUpdateError.message ?? "Failed to update opportunity" };
  }

  revalidatePath("/client/dashboard");
  revalidatePath("/gigs");
  revalidatePath(`/gigs/${input.gigId}`);

  return { ok: true };
}


