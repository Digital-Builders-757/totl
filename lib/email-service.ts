import { Resend } from "resend";
import { logger } from "@/lib/utils/logger";

// Initialize Resend with API key (only if available)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email sender configuration
const FROM_EMAIL = "noreply@mail.thetotlagency.com";
const FROM_NAME = "TOTL Agency";

// Email templates
export type EmailTemplate =
  | "welcome"
  | "verification"
  | "password-reset"
  | "application-received"
  | "application-accepted"
  | "application-rejected"
  | "booking-confirmed"
  | "booking-reminder"
  | "new-application-client"
  | "gig-invitation"
  // Client onboarding email templates
  | "client-application-admin"
  | "client-application-confirmation"
  | "client-application-approved"
  | "client-application-rejected"
  | "client-application-followup-applicant"
  | "client-application-followup-admin";

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (process.env.DISABLE_EMAIL_SENDING === "1") {
    logger.warn("[totl][email] sending disabled (DISABLE_EMAIL_SENDING=1)", { to, subject });
    return { success: true, messageId: "disabled" };
  }

  if (!resendApiKey || !resend) {
    logger.warn("RESEND_API_KEY is not defined - email sending disabled");
    // In non-production (dev/test), no-op success to avoid blocking local workflows.
    // In production, we must fail loudly to avoid silent email loss.
    if (process.env.NODE_ENV !== "production") {
      logger.info(`[DEV] Would send email to ${to}: ${subject}`);
      return { success: true, messageId: "dev-mode" };
    }
    throw new Error("RESEND_API_KEY is not defined");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || "",
    });

    if (error) {
      logger.error("Error sending email", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error("Error sending email", error);
    throw error;
  }
}

/**
 * Log email sending attempts for monitoring
 */
export async function logEmailSent(
  to: string,
  template: EmailTemplate,
  success: boolean,
  error?: string
) {
  // Log to your database or monitoring service
  logger.info(`Email ${success ? "sent" : "failed"} to ${to}, template: ${template}`, error || "");

  // You could also log to Supabase here
  // const supabase = createSupabaseClient();
  // await supabase.from('email_logs').insert([
  //   { recipient: to, template, success, error_message: error }
  // ]);
}
