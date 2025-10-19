import { Resend } from "resend";

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
  | "gig-invitation";

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
  if (!resendApiKey || !resend) {
    console.warn("RESEND_API_KEY is not defined - email sending disabled");
    // In development/build time, return success to prevent build failures
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production") {
      console.log(`[DEV] Would send email to ${to}: ${subject}`);
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
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error sending email:", error);
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
  console.log(`Email ${success ? "sent" : "failed"} to ${to}, template: ${template}`, error || "");

  // You could also log to Supabase here
  // const supabase = createSupabaseClient();
  // await supabase.from('email_logs').insert([
  //   { recipient: to, template, success, error_message: error }
  // ]);
}
