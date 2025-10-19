import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/services/email-service";
import { generateApplicationAcceptedEmail } from "@/lib/services/email-templates";

export async function POST(request: Request) {
  try {
    const { email, talentName, gigTitle, clientName, dashboardUrl } = await request.json();

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
      dashboardUrl: dashboardUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/talent/dashboard`,
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

