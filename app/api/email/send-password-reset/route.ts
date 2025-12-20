import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/email-service";
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

    // Abuse throttle (must not affect response semantics).
    if (shouldThrottlePublicEmail({ request, route: "send-password-reset", email })) {
      await logEmailSent(email, "password-reset", false, "throttled");
      return NextResponse.json({ success: true, requestId });
    }

    const supabase = createSupabaseAdminClient();

    // Generate a password reset link using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
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
      await logEmailSent(email, "password-reset", false, error?.message);
      return NextResponse.json({ success: true, requestId });
    }

    const resetUrl = data.properties.action_link;
    const name = email.split("@")[0];

    // Generate the email template
    const { subject, html } = generatePasswordResetEmail({ name, resetUrl });

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    });

    await logEmailSent(email, "password-reset", true);

    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    // IMPORTANT: Do not leak whether the email exists.
    return NextResponse.json({ success: true, requestId });
  }
}
