import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { generateNewApplicationClientEmail } from "@/lib/services/email-templates";

export async function POST(request: Request) {
  try {
    const { email, clientName, gigTitle, dashboardUrl } = await request.json();

    if (!email || !clientName || !gigTitle) {
      return NextResponse.json(
        { error: "Missing required fields: email, clientName, gigTitle" },
        { status: 400 }
      );
    }

    // Generate the email template
    const { subject, html } = generateNewApplicationClientEmail({
      name: clientName,
      gigTitle,
      dashboardUrl: dashboardUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/client/dashboard`,
    });

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    });

    await logEmailSent(email, "new-application-client", true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending new application client email:", error);
    await logEmailSent(
      "",
      "new-application-client",
      false,
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to send new application client email" },
      { status: 500 }
    );
  }
}

