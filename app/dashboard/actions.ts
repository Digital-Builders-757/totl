"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createSupabaseActionClient } from "@/lib/supabase-client";

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseActionClient();

  // Get the current session to verify the user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const displayName = formData.get("display_name") as string;

  // Update the profile using the user's ID from the session
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", session.user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }

  // Revalidate the dashboard path to refresh the data
  revalidatePath("/dashboard");

  return { success: true };
}

export async function createTalentProfile(formData: FormData) {
  const supabase = await createSupabaseActionClient();

  // Get the current session to verify the user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Not authenticated" };
  }

  // Extract form data
  const experience = formData.get("bio") as string; // Using bio as experience description
  const languages = (formData.get("skills") as string).split(",").map((skill) => skill.trim());
  const age = Number.parseInt(formData.get("experience_years") as string);
  const portfolioUrl = formData.get("portfolio_url") as string;

  // Check if a talent profile already exists
  const { data: existingProfile } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  let error;

  if (existingProfile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from("talent_profiles")
      .update({
        experience,
        languages,
        age,
        portfolio_url: portfolioUrl,
      })
      .eq("user_id", session.user.id);

    error = updateError;
  } else {
    // Create new profile
    const { error: insertError } = await supabase.from("talent_profiles").insert({
      user_id: session.user.id,
      first_name: "", // Required field
      last_name: "", // Required field
      experience,
      languages,
      age,
      portfolio_url: portfolioUrl,
    });

    error = insertError;
  }

  if (error) {
    console.error("Error with talent profile:", error);
    return { error: error.message };
  }

  // Revalidate the dashboard path to refresh the data
  revalidatePath("/dashboard");

  return { success: true };
}
