"use server";

import { createSupabaseActionClient } from "@/lib/supabase-client";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import {
  generateClientApplicationAdminNotificationEmail,
  generateClientApplicationConfirmationEmail,
  generateClientApplicationApprovedEmail,
  generateClientApplicationRejectedEmail,
} from "@/lib/services/email-templates";

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
    const { data: application, error } = await supabase
      .from("client_applications")
      .insert([
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
      ])
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Error submitting client application:", error);
      return { error: error.message };
    }

    // Send email notifications
    try {
      const applicantName = `${data.firstName} ${data.lastName}`;
      const applicationDate = new Date(application.created_at).toLocaleDateString();

      // 1. Send confirmation email to applicant
      const confirmationEmail = generateClientApplicationConfirmationEmail({
        name: applicantName,
        companyName: data.companyName,
        industry: data.industry || undefined,
        applicationId: application.id,
        applicationDate,
      });

      await sendEmail({
        to: data.email,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
      });

      await logEmailSent(data.email, "client-application-confirmation", true);

      // 2. Send notification email to admin team
      const adminEmail = generateClientApplicationAdminNotificationEmail({
        name: applicantName,
        companyName: data.companyName,
        clientName: data.email, // Using for display in admin email
        industry: data.industry || undefined,
        businessDescription: data.businessDescription,
        needsDescription: data.needsDescription,
        applicationId: application.id,
      });

      // Send to admin email (configure this in your environment variables)
      const adminEmailAddress = process.env.ADMIN_EMAIL || "admin@thetotlagency.com";
      
      await sendEmail({
        to: adminEmailAddress,
        subject: adminEmail.subject,
        html: adminEmail.html,
      });

      await logEmailSent(adminEmailAddress, "client-application-admin", true);
    } catch (emailError) {
      // Log email errors but don't fail the application submission
      console.error("Error sending client application emails:", emailError);
      await logEmailSent(
        data.email,
        "client-application-confirmation",
        false,
        emailError instanceof Error ? emailError.message : "Unknown error"
      );
    }

    return { success: true, applicationId: application.id };
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

    // Get application details for email
    const { data: applicationData, error: fetchError } = await supabase
      .from("client_applications")
      .select("first_name, last_name, email, company_name, industry")
      .eq("id", applicationId)
      .single();

    if (fetchError || !applicationData) {
      return { error: "Application not found" };
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

    // Send approval email to applicant
    try {
      const applicantName = `${applicationData.first_name} ${applicationData.last_name}`;
      const approvalEmail = generateClientApplicationApprovedEmail({
        name: applicantName,
        companyName: applicationData.company_name,
        adminNotes: adminNotes || undefined,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/login`,
      });

      await sendEmail({
        to: applicationData.email,
        subject: approvalEmail.subject,
        html: approvalEmail.html,
      });

      await logEmailSent(applicationData.email, "client-application-approved", true);
    } catch (emailError) {
      // Log email errors but don't fail the approval
      console.error("Error sending approval email:", emailError);
      await logEmailSent(
        applicationData.email,
        "client-application-approved",
        false,
        emailError instanceof Error ? emailError.message : "Unknown error"
      );
    }

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

    // Get application details for email
    const { data: applicationData, error: fetchError } = await supabase
      .from("client_applications")
      .select("first_name, last_name, email, company_name")
      .eq("id", applicationId)
      .single();

    if (fetchError || !applicationData) {
      return { error: "Application not found" };
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

    // Send rejection email to applicant
    try {
      const applicantName = `${applicationData.first_name} ${applicationData.last_name}`;
      const rejectionEmail = generateClientApplicationRejectedEmail({
        name: applicantName,
        companyName: applicationData.company_name,
        adminNotes: adminNotes || undefined,
      });

      await sendEmail({
        to: applicationData.email,
        subject: rejectionEmail.subject,
        html: rejectionEmail.html,
      });

      await logEmailSent(applicationData.email, "client-application-rejected", true);
    } catch (emailError) {
      // Log email errors but don't fail the rejection
      console.error("Error sending rejection email:", emailError);
      await logEmailSent(
        applicationData.email,
        "client-application-rejected",
        false,
        emailError instanceof Error ? emailError.message : "Unknown error"
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error rejecting client application:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
