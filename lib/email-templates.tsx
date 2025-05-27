// This file must only be imported in server-side code (API routes, server actions, or server components).
// Do NOT import in any Client Component or file with "use client".

// Pure TypeScript approach - no React dependencies
export interface EmailTemplateData {
  name: string
  loginUrl?: string
  verificationUrl?: string
  resetUrl?: string
  gigTitle?: string
}

export interface EmailTemplate {
  subject: string
  html: string
}

// Base template function
function createBaseTemplate(title: string, content: string, previewText = ""): string {
  const currentYear = new Date().getFullYear()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${previewText ? `<meta name="description" content="${escapeHtml(previewText)}">` : ""}
  <style>/* ...styles omitted for brevity, use the user's provided CSS... */</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img 
        src="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.thetotlagency.com"}/images/totl-logo-transparent.png" 
        alt="TOTL Agency" 
        class="logo"
      />
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${currentYear} TOTL Agency. All rights reserved.</p>
      <p>123 Fashion Avenue, New York, NY 10001</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.thetotlagency.com"}/unsubscribe" style="color: #999999;">Unsubscribe</a> |
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.thetotlagency.com"}/privacy" style="color: #999999;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// HTML escaping utility for security
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

export function generateWelcomeEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>Welcome to TOTL Agency, ${escapeHtml(data.name)}!</h1>
    <p>Thank you for joining TOTL Agency. We're excited to have you on board and look forward to helping you advance your career in the entertainment industry.</p>
    <div class="highlight">
      <p><strong>With your new account, you can:</strong></p>
      <ul>
        <li>Create and manage your professional profile</li>
        <li>Browse and apply for exclusive gigs</li>
        <li>Connect with top industry professionals</li>
        <li>Access premium resources and tools</li>
        <li>Track your application status in real-time</li>
      </ul>
    </div>
    <p>To get started, please log in to your account and complete your profile:</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(data.loginUrl || "")}" class="button">Log In to Your Account</a>
    </div>
    <p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out at any time.</p>
    <p>
      Best regards,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `
  return {
    subject: "Welcome to TOTL Agency - Your Journey Begins Now",
    html: createBaseTemplate("Welcome to TOTL Agency", content, "Your journey with TOTL Agency begins now"),
  }
}

export function generateVerificationEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>Verify Your Email Address</h1>
    <p>Hello ${escapeHtml(data.name)},</p>
    <p>Thank you for registering with TOTL Agency. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(data.verificationUrl || "")}" class="button">Verify Email Address</a>
    </div>
    <div class="highlight">
      <p><strong>Important:</strong></p>
      <ul>
        <li>This verification link will expire in 24 hours</li>
        <li>You must verify your email to access all platform features</li>
        <li>If you didn't create this account, please ignore this email</li>
      </ul>
    </div>
    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px;">${escapeHtml(data.verificationUrl || "")}</p>
    <p>
      Best regards,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `
  return {
    subject: "Verify Your Email Address - TOTL Agency",
    html: createBaseTemplate(
      "Verify Your Email Address",
      content,
      "Please verify your email address to complete your TOTL Agency registration",
    ),
  }
}

export function generatePasswordResetEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>Reset Your Password</h1>
    <p>Hello ${escapeHtml(data.name)},</p>
    <p>We received a request to reset your password for your TOTL Agency account. If you made this request, click the button below to create a new password:</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(data.resetUrl || "")}" class="button">Reset Password</a>
    </div>
    <div class="highlight">
      <p><strong>Security Notice:</strong></p>
      <ul>
        <li>This password reset link will expire in 1 hour</li>
        <li>You can only use this link once</li>
        <li>If you didn't request this reset, please ignore this email</li>
        <li>Your current password remains unchanged until you complete the reset</li>
      </ul>
    </div>
    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px;">${escapeHtml(data.resetUrl || "")}</p>
    <p>If you continue to have issues or didn't request this password reset, please contact our support team immediately.</p>
    <p>
      Best regards,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `
  return {
    subject: "Reset Your Password - TOTL Agency",
    html: createBaseTemplate("Reset Your Password", content, "Instructions to reset your TOTL Agency password"),
  }
}

export function generateApplicationReceivedEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>Application Received</h1>
    <p>Hello ${escapeHtml(data.name)},</p>
    <p>Thank you for applying to the <strong>${escapeHtml(data.gigTitle || "gig")}</strong> through TOTL Agency.</p>
    <div class="highlight">
      <p><strong>What happens next:</strong></p>
      <ul>
        <li>Our team will review your application within 24-48 hours</li>
        <li>The client will be notified of your interest</li>
        <li>You'll receive updates on your application status</li>
        <li>If selected, you'll be contacted directly for next steps</li>
      </ul>
    </div>
    <p>You can track the status of this and all your applications in your dashboard:</p>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.thetotlagency.com"}/dashboard/talent" class="button">View Dashboard</a>
    </div>
    <p>We appreciate your interest and wish you the best of luck with your application!</p>
    <p>
      Best regards,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `
  return {
    subject: `Application Received - ${data.gigTitle || "TOTL Agency"}`,
    html: createBaseTemplate("Application Received", content, "Your application has been received by TOTL Agency"),
  }
}

export function generateEmailBatch(
  templates: Array<{
    type: "welcome" | "verification" | "passwordReset" | "applicationReceived"
    data: EmailTemplateData
  }>,
): EmailTemplate[] {
  return templates.map(({ type, data }) => {
    switch (type) {
      case "welcome":
        return generateWelcomeEmail(data)
      case "verification":
        return generateVerificationEmail(data)
      case "passwordReset":
        return generatePasswordResetEmail(data)
      case "applicationReceived":
        return generateApplicationReceivedEmail(data)
      default:
        throw new Error(`Unknown email template type: ${type}`)
    }
  })
}
