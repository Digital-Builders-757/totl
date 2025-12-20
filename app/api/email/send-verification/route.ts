import "server-only";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { claimEmailSend, EmailSendPurpose } from "@/lib/server/email/claim-email-send";
import { shouldThrottlePublicEmail } from "@/lib/server/email/public-email-throttle";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { generateVerificationEmail } from "@/lib/services/email-templates";
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client";

export const runtime = "nodejs"; // Needed for email operations

// Validation schema
const verificationSchema = z.object({
  email: z.string().email("Invalid email format"),
  userId: z.string().optional(),
  firstName: z.string().optional(),
  verificationLink: z.string().url().optional(),
});

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    const body = await request.json();

    // Validate input with Zod
    const result = verificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", requestId }, { status: 400 });
    }

    const { email, firstName, verificationLink } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Abuse throttle (must not affect response semantics).
    if (shouldThrottlePublicEmail({ request, route: "send-verification", email: normalizedEmail })) {
      await logEmailSent(normalizedEmail, "verification", false, "throttled");
      return NextResponse.json({ success: true, requestId });
    }

    // Durable throttle + idempotency gate (one click → one send).
    // MUST happen before link generation and provider calls.
    const claim = await claimEmailSend({
      purpose: EmailSendPurpose.VERIFY_EMAIL,
      recipientEmail: normalizedEmail,
    });
    if (!claim.didClaim) {
      await logEmailSent(normalizedEmail, "verification", false, `ledger:${claim.reason}`);
      return NextResponse.json({ success: true, requestId });
    }

    let verificationUrl: string;

    // If verification link is provided, use it; otherwise generate one
    if (verificationLink) {
      verificationUrl = verificationLink;
    } else {
      const supabase = createSupabaseAdminClient();

      // Generate a verification link using Supabase
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "signup",
        email: normalizedEmail,
        password: "", // Empty password for existing users
        options: {
          redirectTo: absoluteUrl("/auth/callback"),
        },
      });

      // IMPORTANT: Do not leak whether the email/user exists or any other sensitive state.
      // If link generation fails, still return success.
      if (error || !data.properties?.action_link) {
        console.warn("[totl][email] verification link generation failed (masked)", {
          requestId,
          errorMessage: error?.message ?? null,
        });
        await logEmailSent(normalizedEmail, "verification", false, error?.message);
        return NextResponse.json({ success: true, requestId });
      }

      verificationUrl = data.properties.action_link;
    }
    const name = firstName || normalizedEmail.split("@")[0];

    // Generate the email template
    const { subject, html } = generateVerificationEmail({ name, verificationUrl });

    // Send the email
    await sendEmail({
      to: normalizedEmail,
      subject,
      html,
    });

    await logEmailSent(normalizedEmail, "verification", true);

    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    console.error("Error sending verification email:", error);
    // IMPORTANT: Do not leak whether the email/user exists.
    return NextResponse.json({ success: true, requestId });
  }
}
