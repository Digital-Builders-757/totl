"use server";

import { revalidatePath } from "next/cache";
import { insertNotification } from "@/lib/actions/notification-actions";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { generateApplicationReceivedEmail, generateNewApplicationClientEmail } from "@/lib/services/email-templates";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { logger } from "@/lib/utils/logger";

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
    return { error: "You must be logged in to apply for opportunities" };
  }

  // Check if user has talent role and active subscription
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "talent") {
    return { error: "Only talent users can apply for opportunities" };
  }

  // Check subscription status - only active subscribers can apply
  if (profile.subscription_status !== 'active') {
    const subscriptionMessages = {
'none': 'You need an active subscription to apply to opportunities. Subscribe now to unlock this feature.',
    'canceled': 'Your subscription has ended. Reactivate your subscription to apply to opportunities.',
    'past_due': 'Your payment is overdue. Please update your payment method to continue applying to opportunities.',
    };
    
    const subscriptionErrorMessage = subscriptionMessages[profile.subscription_status as keyof typeof subscriptionMessages] || 
                   'An active subscription is required to apply to opportunities.';
    
    return { error: subscriptionErrorMessage };
  }

  // Check if user has a complete talent profile
  const { data: talentProfile, error: talentProfileError } = await supabase
    .from("talent_profiles")
    .select("id, user_id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentProfileError || !talentProfile) {
    logger.error("Talent profile not found", talentProfileError ?? new Error("Talent profile missing"), {
      feature: "application-submission",
      error_type: "missing_talent_profile",
      error_code: talentProfileError?.code ?? "PGRST116",
      userId: user.id,
      userEmail: user.email,
      gigId: gigId,
    });

    // Provide more specific error messages based on error type
    if (talentProfileError?.code === "PGRST116") {
      return {
        error:
          "Your talent profile is incomplete. Please complete your profile in settings before applying for opportunities.",
      };
    }

    return {
      error:
        "Please complete your talent profile before applying for opportunities. Go to your profile settings to get started.",
    };
  }

  // Optional: Verify minimum required fields
  if (!talentProfile.first_name || !talentProfile.last_name) {
    return {
      error: "Please complete your name in your profile before applying for opportunities.",
    };
  }

  // Check if user already applied
  const { data: existingApplication, error: existingApplicationError } = await supabase
    .from("applications")
    .select("id")
    .eq("gig_id", gigId)
    .eq("talent_id", user.id)
    .maybeSingle();

  if (existingApplicationError) {
    logger.error("Existing application check error", existingApplicationError);
    return { error: "Failed to verify existing application. Please try again." };
  }

  if (existingApplication) {
    return { error: "You have already applied for this opportunity" };
  }

  // Verify gig exists and is active
  const { data: gig, error: gigError } = await supabase
    .from("gigs")
    .select("id, title, client_id")
    .eq("id", gigId)
    .eq("status", "active")
    .maybeSingle();

  if (gigError || !gig) {
    return { error: "Opportunity not found or no longer available" };
  }

  // Submit application
  const { data: application, error: insertError } = await supabase
    .from("applications")
    .insert({
      gig_id: gigId,
      talent_id: user.id,
      status: "new",
      message: message,
    })
    .select("id,gig_id,talent_id,status,message,created_at,updated_at")
    .single();

  if (insertError) {
    logger.error("Application insert error", insertError, {
      feature: "application-submission",
      error_type: "application_insert_failed",
      error_code: insertError.code ?? "UNKNOWN",
      userId: user.id,
      userEmail: user.email,
      gigId: gigId,
      gigTitle: gig.title,
    });

    // Provide more specific error messages based on error type
    if (insertError.code === "23505") {
      // Unique constraint violation
      return { error: "You have already applied for this opportunity." };
    } else if (insertError.code === "23503") {
      // Foreign key constraint violation
      return { error: "Invalid opportunity or user data. Please refresh and try again." };
    }

    return { error: "Failed to submit application. Please try again." };
  }

  // Send email notifications (best-effort; never fail the apply on email issues)
  try {
    // 1) Email to talent confirming application received (server-only direct call; no internal HTTP hop).
    const talentEmail = user.email;
    if (talentEmail) {
      const { subject, html } = generateApplicationReceivedEmail({
        name: talentProfile.first_name,
        gigTitle: gig.title,
      });
      await sendEmail({ to: talentEmail, subject, html });
      await logEmailSent(talentEmail, "application-received", true);
    }

    // 2. Email to client about new application
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("contact_email, contact_name")
      .eq("user_id", gig.client_id)
      .maybeSingle();

    if (clientProfile?.contact_email) {
      const { subject, html } = generateNewApplicationClientEmail({
        name: clientProfile.contact_name || "Client",
        gigTitle: gig.title,
        dashboardUrl: absoluteUrl("/client/dashboard"),
      });
      await sendEmail({ to: clientProfile.contact_email, subject, html });
      await logEmailSent(clientProfile.contact_email, "new-application-client", true);
    }
  } catch (emailError) {
    logger.error("Failed to send application emails", emailError, {
      feature: "email-notifications",
      email_type: "application-submitted",
    });
  }

  // In-app notification for client (best-effort; never block success)
  try {
    await insertNotification({
      recipientId: gig.client_id,
      type: "new_application",
      referenceId: application.id,
      title: "New application",
      body: `Someone applied to "${gig.title}"`,
    });
  } catch (err) {
    logger.error("Failed to insert in-app notification", err, {
      feature: "in-app-notifications",
      notification_type: "new_application",
      reference_id: application.id,
    });
  }

  // Revalidate relevant paths
  revalidatePath("/gigs");
  revalidatePath(`/gigs/${gigId}`);
  revalidatePath(`/gigs/${gigId}/apply`);
  revalidatePath("/talent/dashboard");
  revalidatePath("/admin/applications");

  return { success: true, application };
}
