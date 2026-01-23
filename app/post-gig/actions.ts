"use server";

import { uploadGigImage } from "@/lib/actions/gig-actions";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

type GigInsert = Database["public"]["Tables"]["gigs"]["Insert"];

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
    const uploadResult = await uploadGigImage(input.imageFile, user.id);
    if ("error" in uploadResult) {
      return { ok: false, error: uploadResult.error };
    }
    imageUrl = uploadResult.url;
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
  };

  const { data, error } = await supabase
    .from("gigs")
    .insert(payload)
    .select("id")
    .single();

  // If DB insert fails but image was uploaded, clean up orphaned image
  if ((error || !data) && imageUrl) {
    const { deleteGigImage } = await import("@/lib/actions/gig-actions");
    await deleteGigImage(imageUrl, user.id);
    return { ok: false, error: error?.message ?? "Failed to create gig" };
  }

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create gig" };

  return { ok: true, gigId: data.id };
}


