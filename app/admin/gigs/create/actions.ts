"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function createGig(formData: FormData) {
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
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can create gigs" };
  }

  // Extract form data
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;
  const startDate = formData.get("start_date") as string;
  const compensationMin = formData.get("compensation_min") as string;
  const compensationMax = formData.get("compensation_max") as string;

  // Get requirements (they come as multiple form fields)
  const requirements: string[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith("requirement_") && value) {
      requirements.push(value as string);
    }
  });

  // Validate required fields
  if (!title || !description || !category || !location) {
    return { error: "Please fill in all required fields" };
  }

  // Format compensation
  const minComp = parseInt(compensationMin) || 0;
  const maxComp = parseInt(compensationMax) || 0;
  const compensation = maxComp > minComp ? `$${minComp} - $${maxComp}` : `$${minComp}`;

  // Insert gig into database (always active when created)
  const { data: gig, error: insertError } = await supabase
    .from("gigs")
    .insert({
      client_id: user.id,
      title,
      description,
      category,
      location,
      compensation,
      duration: "TBD", // Default duration
      date: startDate || new Date().toISOString().split("T")[0],
      status: "active" as const,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating gig:", insertError);
    throw new Error(`Failed to create gig: ${insertError.message}`);
  }

  // Revalidate relevant pages
  revalidatePath("/admin/dashboard");
  revalidatePath("/gigs");
  revalidatePath("/admin/gigs/create");

  // Return success
  return { success: true, gigId: gig.id };
}
