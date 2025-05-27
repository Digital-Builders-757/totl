import { NextResponse } from "next/server"
import { sendEmail, logEmailSent } from "@/lib/email-service"
import { renderPasswordResetEmail } from "@/lib/email-templates"
import { createSupabaseAdminClient } from "@/lib/supabase-admin-client"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Get user info to personalize the email
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("email", email)
      .single()

    // Generate a password reset link using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
      },
    })

    if (error || !data.properties?.action_link) {
      console.error("Error generating password reset link:", error)
      await logEmailSent(email, "password-reset", false, error?.message)
      return NextResponse.json({ error: "Failed to generate password reset link" }, { status: 500 })
    }

    const resetUrl = data.properties.action_link
    const name = userData?.first_name || email.split("@")[0]

    // Render the email HTML
    const html = renderPasswordResetEmail({
      name,
      resetUrl,
    })

    // Send the email
    await sendEmail({
      to: email,
      subject: "Reset Your Password - TOTL Agency",
      html,
    })

    await logEmailSent(email, "password-reset", true)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 })
  }
}
