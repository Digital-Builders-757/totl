# Email Service Documentation

This document provides a comprehensive guide to the email service implementation using Resend as the SMTP provider for TOTL Agency.

## Overview

The email service is built to handle all transactional emails for the TOTL Agency platform, including:
- Welcome emails
- Email verification
- Password reset
- Application notifications
- Gig invitations

## Configuration

### Environment Variables

The following environment variables need to be set:

\`\`\`env
RESEND_API_KEY=re_123456789
NEXT_PUBLIC_SITE_URL=https://www.thetotlagency.com
\`\`\`

### Resend Setup

1. Create a Resend account at [resend.com](https://resend.com)
2. Verify your domain
3. Generate an API key
4. Add the API key to your environment variables

## Email Templates

All email templates are defined in `lib/email-templates.tsx` using React components that are rendered to static HTML. This approach allows for:
- Consistent styling across all emails
- Easy maintenance and updates
- Type-safe template parameters

### Available Templates

1. **Welcome Email**: Sent after a user successfully creates an account
2. **Verification Email**: Sent to verify a user's email address
3. **Password Reset Email**: Sent when a user requests a password reset
4. **Application Received Email**: Sent to confirm receipt of a gig application

## API Endpoints

### `/api/email/send-welcome`
Sends a welcome email to a new user.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "firstName": "John"
}
\`\`\`

### `/api/email/send-verification`
Sends an email verification link.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "userId": "123456",
  "firstName": "John"
}
\`\`\`

### `/api/email/send-password-reset`
Sends a password reset link.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com"
}
\`\`\`

### `/api/email/send-application-received`
Sends a confirmation email for a gig application.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "firstName": "John",
  "gigTitle": "Fashion Photoshoot"
}
\`\`\`

## Frontend Integration

The `useEmailService` hook provides a convenient way to send emails from frontend components:

\`\`\`tsx
const { sendWelcomeEmail, isLoading, error } = useEmailService();

// Later in your component
const handleSignup = async () => {
  // ... signup logic
  
  await sendWelcomeEmail({
    email: user.email,
    firstName: user.firstName
  });
};
\`\`\`

## Error Handling and Logging

All email sending attempts are logged for monitoring purposes. Logs include:
- Recipient email
- Template used
- Success/failure status
- Error message (if applicable)

## Security Considerations

1. All API endpoints validate input data
2. Email templates are sanitized to prevent XSS attacks
3. Rate limiting is applied to prevent abuse
4. Sensitive operations require authentication

## Maintenance and Updates

To add a new email template:

1. Create the template in `lib/email-templates.tsx`
2. Add a new API endpoint in `app/api/email/`
3. Update the `useEmailService` hook to include the new email type
4. Add documentation for the new template

## Troubleshooting

Common issues and solutions:

1. **Emails not sending**: Check Resend API key and domain verification
2. **Emails going to spam**: Ensure domain is properly configured with SPF, DKIM, and DMARC
3. **Template rendering issues**: Verify HTML compatibility with email clients
