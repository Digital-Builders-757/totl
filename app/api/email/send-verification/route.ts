import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { generateVerificationEmail } from "@/lib/email-templates";
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
  try {
    const body = await request.json();

    // Validate input with Zod
    const result = verificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: result.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, userId, firstName, verificationLink } = result.data;

    let verificationUrl: string;

    // If verification link is provided, use it; otherwise generate one
    if (verificationLink) {
      verificationUrl = verificationLink;
    } else {
      const supabase = createSupabaseAdminClient();

      // Generate a verification link using Supabase
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        password: "", // Empty password for existing users
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (error || !data.properties?.action_link) {
        console.error("Error generating verification link:", error);
        await logEmailSent(email, "verification", false, error?.message);
        return NextResponse.json(
          { error: "Failed to generate verification link" },
          { status: 500 }
        );
      }

      verificationUrl = data.properties.action_link;
    }
    const name = firstName || email.split("@")[0];

    // Generate the email template
    const { subject, html } = generateVerificationEmail({ name, verificationUrl });

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    });

    await logEmailSent(email, "verification", true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}
