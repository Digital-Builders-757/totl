"use server";

import { createSupabaseActionClient } from "@/lib/supabase-client";
import type { Database } from "@/types/supabase";

type ClientApplicationData = {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string | null;
  industry: string | null;
  businessDescription: string;
  needsDescription: string;
  website: string | null;
};

export async function submitClientApplication(data: ClientApplicationData) {
  const supabase = await createSupabaseActionClient();

  try {
    // Insert the application into the client_applications table
    const { error } = await supabase.from("client_applications").insert([
      {
        first_name: data.firstName,
        last_name: data.lastName,
        company_name: data.companyName,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        business_description: data.businessDescription,
        needs_description: data.needsDescription,
        website: data.website,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("Error submitting client application:", error);
      return { error: error.message };
    }

    // In a production environment, you would send an email notification here
    // For now, we'll just return success
    return { success: true };
  } catch (error) {
    console.error("Unexpected error submitting client application:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function approveClientApplication(applicationId: string, adminNotes?: string) {
  const supabase = await createSupabaseActionClient();

  try {
    // First, check if the current user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return { error: "Not authorized" };
    }

    // Update the application status to approved
    const { error } = await supabase
      .from("client_applications")
      .update({
        status: "approved",
        admin_notes: adminNotes || null,
      })
      .eq("id", applicationId);

    if (error) {
      console.error("Error approving client application:", error);
      return { error: error.message };
    }

    // In a production environment, you would send an approval email here
    // For now, we'll just return success
    return { success: true };
  } catch (error) {
    console.error("Unexpected error approving client application:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function rejectClientApplication(applicationId: string, adminNotes?: string) {
  const supabase = await createSupabaseActionClient();

  try {
    // First, check if the current user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return { error: "Not authorized" };
    }

    // Update the application status to rejected
    const { error } = await supabase
      .from("client_applications")
      .update({
        status: "rejected",
        admin_notes: adminNotes || null,
      })
      .eq("id", applicationId);

    if (error) {
      console.error("Error rejecting client application:", error);
      return { error: error.message };
    }

    // In a production environment, you would send a rejection email here
    // For now, we'll just return success
    return { success: true };
  } catch (error) {
    console.error("Unexpected error rejecting client application:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
