import { NextResponse } from "next/server"
import { sendEmail, logEmailSent } from "@/lib/email-service"
import { generateVerificationEmail } from "@/lib/email-templates"
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client"

export async function POST(request: Request) {
  try {
    const { email, userId, firstName } = await request.json()

    if (!email || !userId) {
      return NextResponse.json({ error: "Email and userId are required" }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Generate a verification link using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error || !data.properties?.action_link) {
      console.error("Error generating verification link:", error)
      await logEmailSent(email, "verification", false, error?.message)
      return NextResponse.json({ error: "Failed to generate verification link" }, { status: 500 })
    }

    const verificationUrl = data.properties.action_link
    const name = firstName || email.split("@")[0]

    // Generate the email template
    const { subject, html } = generateVerificationEmail({ name, verificationUrl })

    // Send the email
    await sendEmail({
      to: email,
      subject,
      html,
    })

    await logEmailSent(email, "verification", true)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending verification email:", error)
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
  }
}
