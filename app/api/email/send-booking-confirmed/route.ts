import { NextResponse } from "next/server";
import { sendEmail, logEmailSent } from "@/lib/services/email-service";
import { generateBookingConfirmedEmail } from "@/lib/services/email-templates";

export async function POST(request: Request) {
  try {
    const {
      email,
      talentName,
      gigTitle,
      bookingDate,
      bookingTime,
      bookingLocation,
      compensation,
      dashboardUrl,
    } = await request.json();

    if (!email || !talentName || !gigTitle) {
      return NextResponse.json(
        { error: "Missing required fields: email, talentName, gigTitle" },
        { status: 400 }
      );
    }

    // Generate the email template
    const { subject, html } = generateBookingConfirmedEmail({
      name: talentName,
      gigTitle,
      bookingDate,
      bookingTime,
      bookingLocation,
      compensation,
      dashboardUrl: dashboardUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/talent/dashboard`,
    });

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    });

    await logEmailSent(email, "booking-confirmed", true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending booking confirmed email:", error);
    await logEmailSent(
      "",
      "booking-confirmed",
      false,
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to send booking confirmed email" },
      { status: 500 }
    );
  }
}

