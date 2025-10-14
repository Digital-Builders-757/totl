"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

interface ApplyToGigParams {
  gigId: string;
  message?: string | null;
}

export async function applyToGig({ gigId, message }: ApplyToGigParams) {
  const supabase = await createSupabaseServer();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be logged in to apply for gigs" };
  }

  // Check if user has talent role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "talent") {
    return { error: "Only talent users can apply for gigs" };
  }

  // Check if user already applied
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id")
    .eq("gig_id", gigId)
    .eq("talent_id", user.id)
    .single();

  if (existingApplication) {
    return { error: "You have already applied for this gig" };
  }

  // Verify gig exists and is active
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select("id, title, client_id")
    .eq("id", gigId)
    .eq("status", "active")
    .single();

  if (gigError || !gig) {
    return { error: "Gig not found or no longer available" };
  }

  // Submit application
  const { data: application, error: insertError } = await supabase
    .from("applications")
    .insert({
      gig_id: gigId,
      talent_id: user.id,
      client_id: gig.client_id,
      status: "under_review",
      message: message,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Application insert error:", insertError);
    return { error: "Failed to submit application. Please try again." };
  }

  // Revalidate relevant paths
  revalidatePath("/gigs");
  revalidatePath(`/gigs/${gigId}`);
  revalidatePath(`/gigs/${gigId}/apply`);
  revalidatePath("/talent/dashboard");
  revalidatePath("/admin/applications");

  return { success: true, application };
}
