"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function createProfile(formData: {
  full_name: string
  bio?: string
  role: "talent" | "client"
  location?: string
  website?: string
}) {
  const supabase = createServerActionClient({ cookies })

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  // Create the profile
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    full_name: formData.full_name,
    bio: formData.bio || null,
    role: formData.role,
    location: formData.location || null,
    website: formData.website || null,
  })

  if (error) {
    console.error("Error creating profile:", error)
    throw new Error("Failed to create profile. Please try again.")
  }

  // If role is talent, create a talent profile
  if (formData.role === "talent") {
    const { error: talentError } = await supabase.from("talent_profiles").insert({
      user_id: userId,
    })

    if (talentError) {
      console.error("Error creating talent profile:", talentError)
      throw new Error("Failed to create talent profile. Please try again.")
    }
  }

  // If role is client, create a client profile
  if (formData.role === "client") {
    const { error: clientError } = await supabase.from("client_profiles").insert({
      user_id: userId,
    })

    if (clientError) {
      console.error("Error creating client profile:", clientError)
      throw new Error("Failed to create client profile. Please try again.")
    }
  }

  return { success: true }
}
