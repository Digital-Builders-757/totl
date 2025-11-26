"use server";

import { sendEmail, logEmailSent } from "@/lib/email-service";
import {
  generateClientApplicationAdminNotificationEmail,
  generateClientApplicationConfirmationEmail,
  generateClientApplicationApprovedEmail,
  generateClientApplicationRejectedEmail,
  generateClientApplicationFollowUpApplicantEmail,
  generateClientApplicationFollowUpAdminEmail,
} from "@/lib/services/email-templates";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";
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
  const supabase = await createSupabaseServer();

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
  const supabase = await createSupabaseServer();

  try {
    // First, check if the current user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Use maybeSingle() to prevent 406 errors when profile doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      return { error: "Not authorized" };
    }

    // Get application details for email
    const { data: applicationData, error: fetchError } = await supabase
      .from("client_applications")
      .select("first_name, last_name, email, company_name, industry")
      .eq("id", applicationId)
      .maybeSingle();

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
  const supabase = await createSupabaseServer();

  try {
    // First, check if the current user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Use maybeSingle() to prevent 406 errors when profile doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "admin") {
      return { error: "Not authorized" };
    }

    // Get application details for email
    const { data: applicationData, error: fetchError } = await supabase
      .from("client_applications")
      .select("first_name, last_name, email, company_name")
      .eq("id", applicationId)
      .maybeSingle();

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

type ClientApplicationRow = Database["public"]["Tables"]["client_applications"]["Row"] & {
  follow_up_sent_at?: string | null;
};
type ClientApplicationUpdatePayload =
  Database["public"]["Tables"]["client_applications"]["Update"] & {
    follow_up_sent_at?: string | null;
  };
type ClientApplicationFollowUpFailure = { applicationId: string; stage: string; reason: string };
type ClientApplicationFollowUpResult = {
  success: boolean;
  processed: number;
  sentIds: string[];
  failures: ClientApplicationFollowUpFailure[];
  error?: string;
};

export async function sendClientApplicationFollowUpReminders(): Promise<ClientApplicationFollowUpResult> {
  const supabaseAdmin = createSupabaseAdminClient();
  const reminderCutoff = new Date();
  reminderCutoff.setDate(reminderCutoff.getDate() - 3);
  const reminderCutoffIso = reminderCutoff.toISOString();

  const { data: pendingApplications, error: pendingError } = await supabaseAdmin
    .from("client_applications")
    .select(
      "id, first_name, last_name, email, company_name, industry, business_description, needs_description, created_at, follow_up_sent_at"
    )
    .eq("status", "pending")
    .is("follow_up_sent_at", null)
    .lte("created_at", reminderCutoffIso)
    .returns<
      Pick<
        ClientApplicationRow,
        | "id"
        | "first_name"
        | "last_name"
        | "email"
        | "company_name"
        | "industry"
        | "business_description"
        | "needs_description"
        | "created_at"
        | "follow_up_sent_at"
      >[]
    >();

  if (pendingError) {
    console.error("Error fetching pending client applications for follow-up:", pendingError);
    return { success: false, error: "Failed to fetch pending applications.", processed: 0, sentIds: [], failures: [] };
  }

  if (!pendingApplications?.length) {
    return { success: true, processed: 0, sentIds: [], failures: [] };
  }

  const adminEmailAddress = process.env.ADMIN_EMAIL || "admin@thetotlagency.com";
  const processedIds: string[] = [];
  const failures: ClientApplicationFollowUpFailure[] = [];

  for (const application of pendingApplications) {
    const applicantName = `${application.first_name} ${application.last_name}`.trim();
    const applicationDate = new Date(application.created_at).toLocaleDateString();

    const applicantEmail = generateClientApplicationFollowUpApplicantEmail({
      name: applicantName,
      companyName: application.company_name,
      applicationId: application.id,
      applicationDate,
    });

    try {
      await sendEmail({
        to: application.email,
        subject: applicantEmail.subject,
        html: applicantEmail.html,
      });
      await logEmailSent(application.email, "client-application-followup-applicant", true);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending applicant follow-up:", { applicationId: application.id, reason });
      failures.push({ applicationId: application.id, stage: "applicant-email", reason });
      await logEmailSent(application.email, "client-application-followup-applicant", false, reason);
      continue;
    }

    const adminEmail = generateClientApplicationFollowUpAdminEmail({
      name: applicantName,
      companyName: application.company_name,
      clientName: application.email,
      industry: application.industry || undefined,
      applicationId: application.id,
      applicationDate,
      businessDescription: application.business_description || undefined,
      needsDescription: application.needs_description || undefined,
    });

    try {
      await sendEmail({
        to: adminEmailAddress,
        subject: adminEmail.subject,
        html: adminEmail.html,
      });
      await logEmailSent(adminEmailAddress, "client-application-followup-admin", true);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      console.error("Error sending admin follow-up reminder:", { applicationId: application.id, reason });
      failures.push({ applicationId: application.id, stage: "admin-email", reason });
      await logEmailSent(adminEmailAddress, "client-application-followup-admin", false, reason);
      continue;
    }

    processedIds.push(application.id);
  }

  if (processedIds.length) {
    const followUpUpdate: ClientApplicationUpdatePayload = {
      follow_up_sent_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from("client_applications")
      .update(followUpUpdate)
      .in("id", processedIds);

    if (updateError) {
      console.error("Error updating follow_up_sent_at:", updateError);
      failures.push({
        applicationId: "batch",
        stage: "update-follow-up",
        reason: updateError.message,
      });
      return {
        success: false,
        processed: processedIds.length,
        sentIds: [],
        failures,
        error: updateError.message,
      };
    }
  }

  return {
    success: failures.length === 0,
    processed: processedIds.length,
    sentIds: processedIds,
    failures,
  };
}

type ClientApplicationStatusResponse =
  | {
      success: true;
      application: {
        id: string;
        companyName: string;
        contactName: string;
        status: string;
        businessDescription: string;
        needsDescription: string;
        adminNotes: string | null;
        submittedAt: string;
        updatedAt: string;
      };
    }
  | { success: false; error: string };

export async function checkClientApplicationStatus({
  applicationId,
  email,
}: {
  applicationId: string;
  email: string;
}): Promise<ClientApplicationStatusResponse> {
  const normalizedId = applicationId?.trim();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedId || !normalizedEmail) {
    return { success: false, error: "Application ID and email are required." };
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("client_applications")
      .select(
        `
          id,
          company_name,
          first_name,
          last_name,
          status,
          admin_notes,
          business_description,
          needs_description,
          created_at,
          updated_at
        `
      )
      .eq("id", normalizedId)
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("Error fetching client application status:", error);
      return {
        success: false,
        error: "Unable to look up your application right now. Please try again soon.",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "We couldn't find an application matching that ID and email.",
      };
    }

    return {
      success: true,
      application: {
        id: data.id,
        companyName: data.company_name,
        contactName: `${data.first_name} ${data.last_name}`.trim(),
        status: data.status,
        businessDescription: data.business_description,
        needsDescription: data.needs_description,
        adminNotes: data.admin_notes,
        submittedAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error("Unexpected error checking client application status:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
