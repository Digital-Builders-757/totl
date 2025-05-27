import { NextResponse } from "next/server"
import { sendEmail, logEmailSent } from "@/lib/email-service"
import { renderWelcomeEmail } from "@/lib/email-templates"

export async function POST(request: Request) {
  try {
    const { email, firstName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const name = firstName || email.split("@")[0]
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`

    // Render the email HTML
    const html = renderWelcomeEmail({
      name,
      loginUrl,
    })

    // Send the email
    await sendEmail({
      to: email,
      subject: "Welcome to TOTL Agency",
      html,
    })

    await logEmailSent(email, "welcome", true)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 })
  }
}
