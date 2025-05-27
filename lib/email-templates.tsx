import type React from "react"
import { renderToStaticMarkup } from "react-dom/server"

// Base email template with TOTL Agency styling
const BaseEmailTemplate = ({
  title,
  previewText = "",
  children,
}: {
  title: string
  previewText?: string
  children: React.ReactNode
}) => (
  <html>
    <head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={previewText} />
      <style>{`
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333333;
          line-height: 1.5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #999999;
          margin-top: 30px;
        }
        .button {
          display: inline-block;
          background-color: #000000;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <img
            src="https://www.thetotlagency.com/images/totl-logo-transparent.png"
            alt="TOTL Agency"
            className="logo"
          />
        </div>
        <div className="content">{children}</div>
        <div className="footer">
          <p>© {new Date().getFullYear()} TOTL Agency. All rights reserved.</p>
          <p>123 Fashion Avenue, New York, NY 10001</p>
        </div>
      </div>
    </body>
  </html>
)

// Welcome email template
export function renderWelcomeEmail({ name, loginUrl }: { name: string; loginUrl: string }) {
  const html = renderToStaticMarkup(
    <BaseEmailTemplate title="Welcome to TOTL Agency" previewText="Your journey with TOTL Agency begins now">
      <h1>Welcome to TOTL Agency, {name}!</h1>
      <p>Thank you for joining TOTL Agency. We're excited to have you on board!</p>
      <p>With your new account, you can:</p>
      <ul>
        <li>Create and manage your professional profile</li>
        <li>Browse and apply for exclusive gigs</li>
        <li>Connect with top industry professionals</li>
      </ul>
      <p>To get started, please log in to your account:</p>
      <div style={{ textAlign: "center" }}>
        <a href={loginUrl} className="button">
          Log In to Your Account
        </a>
      </div>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>
        Best regards,
        <br />
        The TOTL Agency Team
      </p>
    </BaseEmailTemplate>,
  )

  return html
}

// Email verification template
export function renderVerificationEmail({ name, verificationUrl }: { name: string; verificationUrl: string }) {
  const html = renderToStaticMarkup(
    <BaseEmailTemplate
      title="Verify Your Email Address"
      previewText="Please verify your email address to complete your TOTL Agency registration"
    >
      <h1>Verify Your Email Address</h1>
      <p>Hello {name},</p>
      <p>
        Thank you for registering with TOTL Agency. To complete your registration, please verify your email address by
        clicking the button below:
      </p>
      <div style={{ textAlign: "center" }}>
        <a href={verificationUrl} className="button">
          Verify Email Address
        </a>
      </div>
      <p>
        This link will expire in 24 hours. If you did not create an account with TOTL Agency, please ignore this email.
      </p>
      <p>
        Best regards,
        <br />
        The TOTL Agency Team
      </p>
    </BaseEmailTemplate>,
  )

  return html
}

// Password reset template
export function renderPasswordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  const html = renderToStaticMarkup(
    <BaseEmailTemplate title="Reset Your Password" previewText="Instructions to reset your TOTL Agency password">
      <h1>Reset Your Password</h1>
      <p>Hello {name},</p>
      <p>
        We received a request to reset your password for your TOTL Agency account. Click the button below to create a
        new password:
      </p>
      <div style={{ textAlign: "center" }}>
        <a href={resetUrl} className="button">
          Reset Password
        </a>
      </div>
      <p>
        This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact
        our support team if you have concerns.
      </p>
      <p>
        Best regards,
        <br />
        The TOTL Agency Team
      </p>
    </BaseEmailTemplate>,
  )

  return html
}

// Application received template
export function renderApplicationReceivedEmail({ name, gigTitle }: { name: string; gigTitle: string }) {
  const html = renderToStaticMarkup(
    <BaseEmailTemplate title="Application Received" previewText="Your application has been received by TOTL Agency">
      <h1>Application Received</h1>
      <p>Hello {name},</p>
      <p>
        Thank you for applying to the <strong>{gigTitle}</strong> gig through TOTL Agency.
      </p>
      <p>
        We've received your application and our team will review it shortly. You'll receive another notification once
        the client has reviewed your application.
      </p>
      <p>You can view the status of your application in your dashboard:</p>
      <div style={{ textAlign: "center" }}>
        <a href="https://www.thetotlagency.com/dashboard/talent" className="button">
          View Dashboard
        </a>
      </div>
      <p>
        Best regards,
        <br />
        The TOTL Agency Team
      </p>
    </BaseEmailTemplate>,
  )

  return html
}
