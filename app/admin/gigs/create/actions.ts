"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadGigImage, deleteGigImage } from "@/lib/actions/gig-actions";
import type { GigReferenceLinkFormRow } from "@/lib/gig-reference-links";
import { parseReferenceLinksForDatabase } from "@/lib/gig-reference-links";
import { validateAdminCreateGigFields } from "@/lib/opportunity-form-helpers";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/supabase";

function parseReferenceLinksFromFormData(
  formData: FormData
): GigReferenceLinkFormRow[] | { error: string } {
  const raw = formData.get("reference_links_json");
  if (raw == null || raw === "") return [];
  if (typeof raw !== "string") return { error: "Invalid reference links payload" };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { error: "Invalid reference links payload" };
    return parsed as GigReferenceLinkFormRow[];
  } catch {
    return { error: "Invalid reference links payload" };
  }
}

export async function createGigFormAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const result = await createGig(formData);
  if ("error" in result) {
    return { error: result.error };
  }
  redirect("/admin/dashboard");
}

export async function createGig(formData: FormData) {
  const referenceLinkRowsParsed = parseReferenceLinksFromFormData(formData);
  if ("error" in referenceLinkRowsParsed) {
    return { error: referenceLinkRowsParsed.error };
  }
  const referenceLinkRows = referenceLinkRowsParsed;

  const supabase = await createSupabaseServer();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be logged in to create a gig" };
  }

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Database["public"]["Tables"]["profiles"]["Row"]["role"] }>();

  if (profile?.role !== "admin") {
    return { error: "Only admins can create gigs" };
  }

  // Extract form data
  const titleRaw = formData.get("title");
  const categoryRaw = formData.get("category");
  const locationRaw = formData.get("location");
  const descriptionRaw = formData.get("description");
  const title = typeof titleRaw === "string" ? titleRaw : "";
  const category = typeof categoryRaw === "string" ? categoryRaw : "";
  const location = typeof locationRaw === "string" ? locationRaw : "";
  const description = typeof descriptionRaw === "string" ? descriptionRaw : "";
  const startDate = formData.get("start_date") as string;
  const applicationDeadlineRaw = formData.get("application_deadline") as string | null;
  const applicationDeadline =
    applicationDeadlineRaw?.trim() ? applicationDeadlineRaw.trim() : null;
  const compensationMin = formData.get("compensation_min") as string;
  const compensationMax = formData.get("compensation_max") as string;

  // Get requirements (they come as multiple form fields)
  const requirements: string[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith("requirement_") && value) {
      requirements.push(value as string);
    }
  });

  const imageFile = formData.get("gig_image");
  const imageFileTyped = imageFile instanceof File ? imageFile : null;

  const adminValidated = validateAdminCreateGigFields({
    title,
    description,
    category,
    location,
  });

  if (!adminValidated.ok) {
    logger.warn("[createGig] Admin create validation failed", {
      surface: "admin-create",
      mode: "create",
      validation: "required_fields",
      missingFields: adminValidated.missingFields,
      referenceLinkRowCount: referenceLinkRows.length,
      hasImageAttempt: Boolean(imageFileTyped && imageFileTyped.size > 0),
    });
    return { error: adminValidated.message };
  }

  const { title: t, description: desc, category: cat, location: loc } = adminValidated.data;

  // Format compensation
  const minComp = parseInt(compensationMin) || 0;
  const maxComp = parseInt(compensationMax) || 0;
  const compensation = maxComp > minComp ? `$${minComp} - $${maxComp}` : `$${minComp}`;

  const linksResult = parseReferenceLinksForDatabase(referenceLinkRows);
  if (!linksResult.ok) {
    logger.warn("[createGig] Reference links validation failed", {
      surface: "admin-create",
      mode: "create",
      validation: "reference_links",
      referenceLinkRowCount: referenceLinkRows.length,
      hasImageAttempt: Boolean(imageFileTyped && imageFileTyped.size > 0),
    });
    return { error: linksResult.error };
  }

  // Upload image if provided (before DB insert to enable cleanup on failure)
  let imageUrl: string | null = null;
  if (imageFileTyped && imageFileTyped.size > 0) {
    const uploadResult = await uploadGigImage(imageFileTyped);
    if (!uploadResult.ok) {
      // Include debug_id in error message for tracing
      const errorMsg = uploadResult.debug_id
        ? `${uploadResult.message} (Debug ID: ${uploadResult.debug_id})`
        : uploadResult.message;
      return { error: errorMsg };
    }
    imageUrl = uploadResult.url;
  }

  // Insert gig into database (always active when created)
  const { data: gig, error: insertError } = await supabase
    .from("gigs")
    .insert({
      client_id: user.id,
      title: t,
      description: desc,
      category: cat,
      location: loc,
      compensation,
      duration: "TBD", // Default duration
      date: startDate || new Date().toISOString().split("T")[0],
      application_deadline: applicationDeadline,
      image_url: imageUrl,
      status: "active" as const,
      reference_links: linksResult.data,
    })
    .select("id")
    .single();

  // If DB insert fails but image was uploaded, clean up orphaned image
  if (insertError && imageUrl) {
    const debugId = randomUUID().replace(/-/g, "").slice(0, 12);
    logger.error("[createGig] Error creating gig", insertError, {
      surface: "admin-create",
      mode: "create",
      validation: "database_insert",
      debugId,
      hadUploadedImage: true,
      referenceLinkRowCount: referenceLinkRows.length,
    });
    await deleteGigImage(imageUrl);
    return { error: `Failed to create opportunity. (Ref: ${debugId})` };
  }

  if (insertError) {
    const debugId = randomUUID().replace(/-/g, "").slice(0, 12);
    logger.error("[createGig] Error creating gig", insertError, {
      surface: "admin-create",
      mode: "create",
      validation: "database_insert",
      debugId,
      hadUploadedImage: false,
      referenceLinkRowCount: referenceLinkRows.length,
    });
    return { error: `Failed to create opportunity. (Ref: ${debugId})` };
  }

  // Revalidate relevant pages
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/gigs");
  revalidatePath("/gigs");
  revalidatePath("/admin/gigs/create");

  // Return success
  return { success: true, gigId: gig.id };
}
