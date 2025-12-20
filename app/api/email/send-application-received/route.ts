import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { requireInternalEmailRequest } from "@/lib/server/email/internal-email-auth";
import { safeRequestJson } from "@/lib/server/safe-request-json";
import { generateApplicationReceivedEmail } from "@/lib/services/email-templates";

export async function POST(request: Request) {
  try {
    const forbidden = requireInternalEmailRequest(request);
    if (forbidden) return forbidden;

    const { email, firstName, gigTitle } = await safeRequestJson<{
      email?: string;
      firstName?: string;
      gigTitle?: string;
    }>(request);

    if (!email || !firstName || !gigTitle) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, gigTitle" },
        { status: 400 }
      );
    }

    // Generate the email template
    const { subject, html } = generateApplicationReceivedEmail({
      name: firstName,
      gigTitle,
    });

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    });

    await logEmailSent(email, "application-received", true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending application received email:", error);
    await logEmailSent(
      "",
      "application-received",
      false,
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to send application received email" },
      { status: 500 }
    );
  }
}

