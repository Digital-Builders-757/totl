import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/email-service";
import { generateApplicationRejectedEmail } from "@/lib/services/email-templates";

export async function POST(request: Request) {
  try {
    const { email, talentName, gigTitle } = await request.json();

    if (!email || !talentName || !gigTitle) {
      return NextResponse.json(
        { error: "Missing required fields: email, talentName, gigTitle" },
        { status: 400 }
      );
    }

    // Generate the email template
    const { subject, html } = generateApplicationRejectedEmail({
      name: talentName,
      gigTitle,
    });

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    });

    await logEmailSent(email, "application-rejected", true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending application rejected email:", error);
    await logEmailSent(
      "",
      "application-rejected",
      false,
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to send application rejected email" },
      { status: 500 }
    );
  }
}

