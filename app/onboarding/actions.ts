"use server";

import { redirect } from "next/navigation";
import { createSupabaseActionClient } from "@/lib/supabase-client";

export async function createProfile(formData: {
  full_name: string;
  bio?: string;
  role: "talent" | "client";
  location?: string;
  website?: string;
}) {
  const supabase = await createSupabaseActionClient();

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Create the profile with only the fields that exist in the profiles table
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    display_name: formData.full_name,
    role: formData.role,
  });

  if (error) {
    console.error("Error creating profile:", error);
    throw new Error("Failed to create profile. Please try again.");
  }

  // If role is talent, create a talent profile with bio and other fields
  if (formData.role === "talent") {
    const { error: talentError } = await supabase.from("talent_profiles").insert({
      user_id: userId,
      first_name: formData.full_name.split(" ")[0] || "",
      last_name: formData.full_name.split(" ").slice(1).join(" ") || "",
      bio: formData.bio || null,
      location: formData.location || null,
      portfolio_url: formData.website || null,
    });

    if (talentError) {
      console.error("Error creating talent profile:", talentError);
      throw new Error("Failed to create talent profile. Please try again.");
    }
  }

  // If role is client, create a client profile
  if (formData.role === "client") {
    const { error: clientError } = await supabase.from("client_profiles").insert({
      user_id: userId,
      company_name: formData.full_name, // Use full_name as company_name for clients
      website: formData.website || null,
    });

    if (clientError) {
      console.error("Error creating client profile:", clientError);
      throw new Error("Failed to create client profile. Please try again.");
    }
  }

  return { success: true };
}
