import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { claimEmailSend, EmailSendPurpose } from "@/lib/server/email/claim-email-send";
import { shouldThrottlePublicEmail } from "@/lib/server/email/public-email-throttle";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { generatePasswordResetEmail } from "@/lib/services/email-templates";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Abuse throttle (must not affect response semantics).
    if (shouldThrottlePublicEmail({ request, route: "send-password-reset", email: normalizedEmail })) {
      await logEmailSent(normalizedEmail, "password-reset", false, "throttled");
      return NextResponse.json({ success: true, requestId });
    }

    // Durable throttle + idempotency gate (one click → one send).
    // MUST happen before link generation and provider calls.
    const claim = await claimEmailSend({
      purpose: EmailSendPurpose.PASSWORD_RESET,
      recipientEmail: normalizedEmail,
    });
    if (!claim.didClaim) {
      await logEmailSent(normalizedEmail, "password-reset", false, `ledger:${claim.reason}`);
      return NextResponse.json({ success: true, requestId });
    }

    const supabase = createSupabaseAdminClient();

    // Generate a password reset link using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: {
        redirectTo: absoluteUrl("/update-password"),
      },
    });

    // IMPORTANT: Do not leak whether the email exists.
    // If link generation fails (non-existent email, misconfig, etc.), still return success.
    if (error || !data.properties?.action_link) {
      console.warn("[totl][email] password reset link generation failed (masked)", {
        requestId,
        errorMessage: error?.message ?? null,
      });
      await logEmailSent(normalizedEmail, "password-reset", false, error?.message);
      return NextResponse.json({ success: true, requestId });
    }

    const resetUrl = data.properties.action_link;
    const name = normalizedEmail.split("@")[0];

    // Generate the email template
    const { subject, html } = generatePasswordResetEmail({ name, resetUrl });

    // Send the email
    await sendEmail({
      to: normalizedEmail,
      subject,
      html,
    });

    await logEmailSent(normalizedEmail, "password-reset", true);

    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // IMPORTANT: Do not leak whether the email exists.
    return NextResponse.json({ success: true, requestId });
  }
}
