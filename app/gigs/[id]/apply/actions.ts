"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { generateApplicationReceivedEmail, generateNewApplicationClientEmail } from "@/lib/services/email-templates";
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

  // Check if user has talent role and active subscription
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "talent") {
    return { error: "Only talent users can apply for gigs" };
  }

  // Check subscription status - only active subscribers can apply
  if (profile.subscription_status !== 'active') {
    const subscriptionMessages = {
      'none': 'You need an active subscription to apply to gigs. Subscribe now to unlock this feature.',
      'canceled': 'Your subscription has ended. Reactivate your subscription to apply to gigs.',
      'past_due': 'Your payment is overdue. Please update your payment method to continue applying to gigs.',
    };
    
    const subscriptionErrorMessage = subscriptionMessages[profile.subscription_status as keyof typeof subscriptionMessages] || 
                   'An active subscription is required to apply to gigs.';
    
    return { error: subscriptionErrorMessage };
  }

  // Check if user has a complete talent profile
  const { data: talentProfile, error: talentProfileError } = await supabase
    .from("talent_profiles")
    .select("id, user_id, first_name, last_name")
    .eq("user_id", user.id)
    .single();

  if (talentProfileError || !talentProfile) {
    console.error("Talent profile not found:", talentProfileError);

    // Track in Sentry with more detailed information
    Sentry.captureException(talentProfileError || new Error("Talent profile missing"), {
      tags: {
        feature: "application-submission",
        error_type: "missing_talent_profile",
        error_code: talentProfileError?.code || "PGRST116",
      },
      extra: {
        userId: user.id,
        userEmail: user.email,
        gigId: gigId,
        errorCode: talentProfileError?.code,
        errorDetails: talentProfileError?.details,
        errorMessage: talentProfileError?.message,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });

    // Provide more specific error messages based on error type
    if (talentProfileError?.code === "PGRST116") {
      return {
        error:
          "Your talent profile is incomplete. Please complete your profile in settings before applying for gigs.",
      };
    }

    return {
      error:
        "Please complete your talent profile before applying for gigs. Go to your profile settings to get started.",
    };
  }

  // Optional: Verify minimum required fields
  if (!talentProfile.first_name || !talentProfile.last_name) {
    return {
      error: "Please complete your name in your profile before applying for gigs.",
    };
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
      status: "new",
      message: message,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Application insert error:", insertError);

    // Track in Sentry with enhanced details
    Sentry.captureException(insertError, {
      tags: {
        feature: "application-submission",
        error_type: "application_insert_failed",
        error_code: insertError.code || "UNKNOWN",
      },
      extra: {
        userId: user.id,
        userEmail: user.email,
        gigId: gigId,
        gigTitle: gig.title,
        applicationData: {
          gig_id: gigId,
          talent_id: user.id,
          status: "new",
          message: message,
        },
        errorCode: insertError.code,
        errorDetails: insertError.details,
        errorMessage: insertError.message,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });

    // Provide more specific error messages based on error type
    if (insertError.code === "23505") {
      // Unique constraint violation
      return { error: "You have already applied for this gig." };
    } else if (insertError.code === "23503") {
      // Foreign key constraint violation
      return { error: "Invalid gig or user data. Please refresh and try again." };
    }

    return { error: "Failed to submit application. Please try again." };
  }

  // Send email notifications
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
      .single();

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
    // Log email errors but don't fail the application
    console.error("Failed to send application emails:", emailError);
    Sentry.captureException(emailError, {
      tags: { feature: "email-notifications", email_type: "application-submitted" },
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
