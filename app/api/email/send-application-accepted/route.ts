import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { requireInternalEmailRequest } from "@/lib/server/email/internal-email-auth";
import { absoluteUrl } from "@/lib/server/get-site-url";
import { safeRequestJson } from "@/lib/server/safe-request-json";
import { generateApplicationAcceptedEmail } from "@/lib/services/email-templates";

export async function POST(request: Request) {
  try {
    const forbidden = requireInternalEmailRequest(request);
    if (forbidden) return forbidden;

    const { email, talentName, gigTitle, clientName, dashboardUrl } = await safeRequestJson<{
      email?: string;
      talentName?: string;
      gigTitle?: string;
      clientName?: string;
      dashboardUrl?: string;
    }>(request);

    if (!email || !talentName || !gigTitle) {
      return NextResponse.json(
        { error: "Missing required fields: email, talentName, gigTitle" },
        { status: 400 }
      );
    }

    // Generate the email template
    const { subject, html } = generateApplicationAcceptedEmail({
      name: talentName,
      gigTitle,
      clientName: clientName || "the client",
      dashboardUrl: dashboardUrl || absoluteUrl("/talent/dashboard"),
    });

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    });

    await logEmailSent(email, "application-accepted", true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending application accepted email:", error);
    await logEmailSent(
      "",
      "application-accepted",
      false,
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to send application accepted email" },
      { status: 500 }
    );
  }
}

