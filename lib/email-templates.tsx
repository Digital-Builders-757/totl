// This file must only be imported in server-side code (API routes, server actions, or server components).
// Do NOT import in any Client Component or file with "use client".

// Pure TypeScript approach - no React dependencies
export interface EmailTemplateData {
  name: string;
  loginUrl?: string;
  verificationUrl?: string;
  resetUrl?: string;
  gigTitle?: string;
  clientName?: string;
  bookingDate?: string;
  bookingTime?: string;
  bookingLocation?: string;
  compensation?: string;
  dashboardUrl?: string;
  gigDescription?: string;
  applicationDate?: string;
  rejectionReason?: string;
  bookingId?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

// Base template function
function createBaseTemplate(title: string, content: string, previewText = ""): string {
  const currentYear = new Date().getFullYear();

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
</html>`;
}

// HTML escaping utility for security
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
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
  `;
  return {
    subject: "Welcome to TOTL Agency - Your Journey Begins Now",
    html: createBaseTemplate(
      "Welcome to TOTL Agency",
      content,
      "Your journey with TOTL Agency begins now"
    ),
  };
}

export function generateVerificationEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://thetotlagency.com/logo.png" alt="TOTL Agency" style="max-width: 150px; height: auto;" />
      </div>
      
      <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">Verify Your Email Address</h1>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello ${escapeHtml(data.name)},</p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Thank you for registering with TOTL Agency. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(data.verificationUrl || "")}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">Verify Email Address</a>
      </div>
      
      <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="color: #111827; font-weight: 600; margin-bottom: 15px;">Important Information:</p>
        <ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">This verification link will expire in 24 hours</li>
          <li style="margin-bottom: 8px;">You must verify your email to access all platform features</li>
          <li style="margin-bottom: 8px;">If you didn't create this account, please ignore this email</li>
        </ul>
      </div>
      
      <p style="color: #6B7280; font-size: 14px; margin: 30px 0;">If the button above doesn't work, you can copy and paste this link into your browser:</p>
      <p style="color: #6B7280; font-size: 14px; word-break: break-all; background-color: #F9FAFB; padding: 12px; border-radius: 6px; margin-bottom: 30px;">${escapeHtml(data.verificationUrl || "")}</p>
      
      <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
        <p style="color: #374151; font-size: 14px; margin: 0;">
          Best regards,<br>
          <strong>The TOTL Agency Team</strong>
        </p>
      </div>
    </div>
  `;
  return {
    subject: "Verify Your Email Address - TOTL Agency",
    html: createBaseTemplate(
      "Verify Your Email Address",
      content,
      "Please verify your email address to complete your TOTL Agency registration"
    ),
  };
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
  `;
  return {
    subject: "Reset Your Password - TOTL Agency",
    html: createBaseTemplate(
      "Reset Your Password",
      content,
      "Instructions to reset your TOTL Agency password"
    ),
  };
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
  `;
  return {
    subject: `Application Received - ${data.gigTitle || "TOTL Agency"}`,
    html: createBaseTemplate(
      "Application Received",
      content,
      "Your application has been received by TOTL Agency"
    ),
  };
}

export function generateApplicationAcceptedEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>🎉 Congratulations, ${escapeHtml(data.name)}!</h1>
    <p>Great news! Your application for <strong>${escapeHtml(data.gigTitle || "")}</strong> has been accepted!</p>
    <div class="highlight" style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="color: white; margin: 0;"><strong>✨ Your Application Was Accepted!</strong></p>
      <p style="color: white; margin: 10px 0 0 0;">The client, <strong>${escapeHtml(data.clientName || "")}</strong>, has selected you for this opportunity.</p>
    </div>
    <div class="highlight">
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>A booking has been created automatically in your dashboard</li>
        <li>Review the booking details and confirm your availability</li>
        <li>The client may reach out to you directly with additional details</li>
        <li>Make sure your calendar is clear for the booking date</li>
      </ul>
    </div>
    <p>View your booking and get all the details in your dashboard:</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(data.dashboardUrl || process.env.NEXT_PUBLIC_SITE_URL + "/talent/dashboard")}" class="button">View Booking Details</a>
    </div>
    <p>This is a great opportunity! Make sure you're prepared and ready to deliver your best work.</p>
    <p>
      Best of luck,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `;
  return {
    subject: `🎉 Application Accepted - ${data.gigTitle || "TOTL Agency"}`,
    html: createBaseTemplate(
      "Application Accepted!",
      content,
      "Congratulations! Your application has been accepted"
    ),
  };
}

export function generateApplicationRejectedEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>Application Update</h1>
    <p>Hello ${escapeHtml(data.name)},</p>
    <p>Thank you for your interest in <strong>${escapeHtml(data.gigTitle || "")}</strong>.</p>
    <p>After careful consideration, we regret to inform you that your application was not selected for this particular opportunity.</p>
    <div class="highlight">
      <p><strong>Important to Remember:</strong></p>
      <ul>
        <li>This decision is specific to this one gig and doesn't reflect on your talent</li>
        <li>Clients often have very specific requirements for each project</li>
        <li>Many factors go into casting decisions beyond your control</li>
        <li>Every "no" brings you closer to the right "yes"</li>
      </ul>
    </div>
    <p>Don't let this discourage you! We encourage you to continue applying to other gigs that match your profile.</p>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.thetotlagency.com"}/gigs" class="button">Browse More Gigs</a>
    </div>
    <p>Keep building your portfolio and applying - the perfect opportunity is out there!</p>
    <p>
      Keep pushing forward,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `;
  return {
    subject: `Application Update - ${data.gigTitle || "TOTL Agency"}`,
    html: createBaseTemplate(
      "Application Update",
      content,
      "Update on your application"
    ),
  };
}

export function generateBookingConfirmedEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>✅ Booking Confirmed</h1>
    <p>Hello ${escapeHtml(data.name)},</p>
    <p>Your booking for <strong>${escapeHtml(data.gigTitle || "")}</strong> has been confirmed!</p>
    <div class="highlight" style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="color: white; margin: 0;"><strong>📅 Booking Details</strong></p>
      <ul style="color: white; margin: 10px 0 0 0;">
        ${data.bookingDate ? `<li><strong>Date:</strong> ${escapeHtml(data.bookingDate)}</li>` : ""}
        ${data.bookingTime ? `<li><strong>Time:</strong> ${escapeHtml(data.bookingTime)}</li>` : ""}
        ${data.bookingLocation ? `<li><strong>Location:</strong> ${escapeHtml(data.bookingLocation)}</li>` : ""}
        ${data.compensation ? `<li><strong>Compensation:</strong> ${escapeHtml(data.compensation)}</li>` : ""}
      </ul>
    </div>
    <div class="highlight">
      <p><strong>Before the Booking:</strong></p>
      <ul>
        <li>Mark your calendar and set reminders</li>
        <li>Confirm the location and arrival time</li>
        <li>Prepare any required materials or wardrobe</li>
        <li>Get a good night's sleep before the shoot</li>
        <li>Arrive 15 minutes early to settle in</li>
      </ul>
    </div>
    <p>You can view all booking details and communicate with the client through your dashboard:</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(data.dashboardUrl || process.env.NEXT_PUBLIC_SITE_URL + "/talent/dashboard")}" class="button">View Booking Dashboard</a>
    </div>
    <p>We'll send you a reminder 24 hours before your booking. Good luck!</p>
    <p>
      Break a leg,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `;
  return {
    subject: `✅ Booking Confirmed - ${data.gigTitle || "TOTL Agency"}`,
    html: createBaseTemplate(
      "Booking Confirmed",
      content,
      "Your booking has been confirmed"
    ),
  };
}

export function generateBookingReminderEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>⏰ Booking Reminder</h1>
    <p>Hello ${escapeHtml(data.name)},</p>
    <p>This is a friendly reminder that you have a booking coming up tomorrow!</p>
    <div class="highlight" style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="color: white; margin: 0;"><strong>🎬 Tomorrow's Booking</strong></p>
      <p style="color: white; margin: 10px 0 0 0; font-size: 18px;"><strong>${escapeHtml(data.gigTitle || "")}</strong></p>
      <ul style="color: white; margin: 10px 0 0 0;">
        ${data.bookingDate ? `<li><strong>Date:</strong> ${escapeHtml(data.bookingDate)}</li>` : ""}
        ${data.bookingTime ? `<li><strong>Time:</strong> ${escapeHtml(data.bookingTime)}</li>` : ""}
        ${data.bookingLocation ? `<li><strong>Location:</strong> ${escapeHtml(data.bookingLocation)}</li>` : ""}
      </ul>
    </div>
    <div class="highlight">
      <p><strong>Final Checklist:</strong></p>
      <ul>
        <li>✅ Confirm you know how to get to the location</li>
        <li>✅ Check traffic/transit and plan to arrive early</li>
        <li>✅ Pack any required wardrobe or materials</li>
        <li>✅ Get a good night's sleep tonight</li>
        <li>✅ Eat a good breakfast before you go</li>
        <li>✅ Charge your phone and bring a charger</li>
      </ul>
    </div>
    <p>Review your booking details one more time:</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(data.dashboardUrl || process.env.NEXT_PUBLIC_SITE_URL + "/talent/dashboard")}" class="button">View Booking Details</a>
    </div>
    <p>You've got this! Have a great shoot tomorrow.</p>
    <p>
      Best wishes,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `;
  return {
    subject: `⏰ Reminder: Booking Tomorrow - ${data.gigTitle || "TOTL Agency"}`,
    html: createBaseTemplate(
      "Booking Reminder",
      content,
      "Your booking is tomorrow - don't forget!"
    ),
  };
}

export function generateNewApplicationClientEmail(data: EmailTemplateData): EmailTemplate {
  const content = `
    <h1>📬 New Application Received</h1>
    <p>Hello ${escapeHtml(data.name)},</p>
    <p>Good news! You've received a new application for your gig <strong>${escapeHtml(data.gigTitle || "")}</strong>.</p>
    <div class="highlight">
      <p><strong>What to do next:</strong></p>
      <ul>
        <li>Review the talent's profile and portfolio</li>
        <li>Check their experience and measurements</li>
        <li>Compare with other applications</li>
        <li>Accept the application to create a booking</li>
        <li>Or reject if they're not the right fit</li>
      </ul>
    </div>
    <p>The talent is waiting to hear from you! Review their application now:</p>
    <div style="text-align: center;">
      <a href="${escapeHtml(data.dashboardUrl || process.env.NEXT_PUBLIC_SITE_URL + "/client/dashboard")}" class="button">Review Application</a>
    </div>
    <p>The best talent gets booked quickly, so don't wait too long to make your decision!</p>
    <p>
      Best regards,<br>
      <strong>The TOTL Agency Team</strong>
    </p>
  `;
  return {
    subject: `📬 New Application - ${data.gigTitle || "TOTL Agency"}`,
    html: createBaseTemplate(
      "New Application Received",
      content,
      "You have a new application to review"
    ),
  };
}

export function generateEmailBatch(
  templates: Array<{
    type: "welcome" | "verification" | "passwordReset" | "applicationReceived" | "applicationAccepted" | "applicationRejected" | "bookingConfirmed" | "bookingReminder" | "newApplicationClient";
    data: EmailTemplateData;
  }>
): EmailTemplate[] {
  return templates.map(({ type, data }) => {
    switch (type) {
      case "welcome":
        return generateWelcomeEmail(data);
      case "verification":
        return generateVerificationEmail(data);
      case "passwordReset":
        return generatePasswordResetEmail(data);
      case "applicationReceived":
        return generateApplicationReceivedEmail(data);
      case "applicationAccepted":
        return generateApplicationAcceptedEmail(data);
      case "applicationRejected":
        return generateApplicationRejectedEmail(data);
      case "bookingConfirmed":
        return generateBookingConfirmedEmail(data);
      case "bookingReminder":
        return generateBookingReminderEmail(data);
      case "newApplicationClient":
        return generateNewApplicationClientEmail(data);
      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  });
}
